import EventEmitter from 'events';
import objectAssign from 'object-assign';

import authenticate from '../AuthClient';
import { checkPushRequirements } from './pushRequirements';
import SegmentUpdateWorker from '../SegmentUpdateWorker';
import SplitUpdateWorker from '../SplitUpdateWorker';
import SSEClient from '../SSEClient';
import SSEHandlerFactory from '../SSEHandler';

import Backoff from '../../utils/backoff';
import { hashUserKey } from '../../utils/jwt/hashUserKey';
import logFactory from '../../utils/logger';
import { SECONDS_BEFORE_EXPIRATION, PUSH_SUBSYSTEM_DOWN, PUSH_SUBSYSTEM_UP, PUSH_NONRETRYABLE_ERROR, PUSH_RETRYABLE_ERROR, SPLIT_KILL, SPLIT_UPDATE, SEGMENT_UPDATE, MY_SEGMENTS_UPDATE, MY_SEGMENTS_UPDATE_V2, ControlTypes } from '../constants';
import { parseBitmap, parseKeyList, isInBitmap } from './mySegmentsV2utils';
import { forOwn } from '../../utils/lang';
import { _Set } from '../../utils/lang/Sets';
import { hash64 } from '../../engine/engine/murmur3/murmur3_64';

const log = logFactory('splitio-sync:push-manager');

// const UnboundedFetchRequest = 0;
const BoundedFetchRequest = 1;
const KeyList = 2;
const SegmentRemoval = 3;

function fallbackWarning(notificationType, e) {
  return `Fetching MySegments due to an error processing ${notificationType} notification: ${e}`;
}

/**
 * Factory of the push mode manager.
 *
 * @param {Object} context context of main client.
 * @param {Object | undefined} clientContexts map of user keys to client contexts to handle sync of MySegments. undefined for node.
 */
export default function PushManagerFactory(context, clientContexts /* undefined for node */) {

  // No return a PushManager if PUSH mode is not supported.
  if (!checkPushRequirements(log)) return;

  const pushEmitter = new EventEmitter();
  const { splits: splitsEventEmitter } = context.get(context.constants.READINESS);
  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);
  const sseClient = SSEClient.getInstance(settings, clientContexts ? false : true);
  const sseHandler = SSEHandlerFactory(pushEmitter);
  sseClient.setEventHandler(sseHandler);

  // map of hashes to user keys, to dispatch MY_SEGMENTS_UPDATE events to the corresponding MySegmentsUpdateWorker
  const userKeyHashes = {};
  // map of user keys to their corresponding hash64 and MySegmentsUpdateWorker.
  // Hash64 is used to process MY_SEGMENTS_UPDATE_V2 events and dispatch actions to the corresponding worker.
  const clients = {};

  // variable used on browser to reconnect only when a new client was added, saving some authentication and sse connections.
  let connectForNewClient = false;
  // flag that indicates if `disconnectPush` was called, either by the SyncManager (when the client is destroyed) or by a PUSH_NONRETRYABLE_ERROR error
  let disconnected;

  /** PushManager functions related to initialization */

  const connectPushRetryBackoff = new Backoff(connectPush, settings.scheduler.pushRetryBackoffBase);

  let timeoutIdTokenRefresh;
  let timeoutIdSseOpen;

  function scheduleTokenRefreshAndSse(authData) {
    // clear scheduled tasks if exist
    if (timeoutIdTokenRefresh) clearTimeout(timeoutIdTokenRefresh);
    if (timeoutIdSseOpen) clearTimeout(timeoutIdSseOpen);

    // Set token refresh 10 minutes before expirationTime - issuedAt
    const decodedToken = authData.decodedToken;
    const refreshTokenDelay = decodedToken.exp - decodedToken.iat - SECONDS_BEFORE_EXPIRATION;
    // Default connDelay of 60 secs
    const connDelay = typeof authData.connDelay === 'number' && authData.connDelay >= 0 ? authData.connDelay : 60;

    log.info(`Refreshing streaming token in ${refreshTokenDelay} seconds, and connecting streaming in ${connDelay} seconds`);

    timeoutIdTokenRefresh = setTimeout(connectPush, refreshTokenDelay * 1000);

    timeoutIdSseOpen = setTimeout(() => {
      // halt if disconnected
      if (disconnected) return;
      sseClient.open(authData);
    }, connDelay * 1000);
  }

  function connectPush() {
    // Halt connecting in case `stop/disconnectPush` has been called
    if (disconnected) return;
    log.info(`${disconnected === undefined ? 'Connecting' : 'Re-connecting'} to push streaming.`);
    disconnected = false;

    const userKeys = clientContexts ? Object.keys(clientContexts) : undefined;
    authenticate(settings, userKeys).then(
      function (authData) {
        if (disconnected) return;

        // 'pushEnabled: false' is handled as a PUSH_NONRETRYABLE_ERROR instead of PUSH_SUBSYSTEM_DOWN, in order to
        // close the sseClient in case the org has been bloqued while the instance was connected to streaming
        if (!authData.pushEnabled) {
          log.info('Streaming is not available. Switching to polling mode.');
          pushEmitter.emit(PUSH_NONRETRYABLE_ERROR);
          return;
        }

        // don't open SSE connection if a new shared client was added, since it means that a new authentication is taking place
        if (userKeys && userKeys.length < Object.keys(clientContexts).length) return;

        // Schedule SSE connection and refresh token
        scheduleTokenRefreshAndSse(authData);
      }
    ).catch(
      function (error) {
        if (disconnected) return;

        log.error(`Failed to authenticate for streaming. Error: ${error.message}.`);

        // Handle 4XX HTTP errors: 401 (invalid API Key) or 400 (using incorrect API Key, i.e., client-side API Key on server-side)
        if (error.statusCode >= 400 && error.statusCode < 500) {
          pushEmitter.emit(PUSH_NONRETRYABLE_ERROR);
          return;
        }

        // Handle other HTTP and network errors as recoverable errors
        pushEmitter.emit(PUSH_RETRYABLE_ERROR);
      }
    );
  }

  // close SSE connection and cancel scheduled tasks
  function disconnectPush() {
    // Halt disconnecting, just to avoid redundant logs if called multiple times
    if (disconnected) return;
    disconnected = true;

    sseClient.close();
    log.info('Disconnecting from push streaming.');

    if (timeoutIdTokenRefresh) clearTimeout(timeoutIdTokenRefresh);
    if (timeoutIdSseOpen) clearTimeout(timeoutIdSseOpen);
    connectPushRetryBackoff.reset();

    stopWorkers();
  }

  pushEmitter.on(PUSH_SUBSYSTEM_DOWN, stopWorkers);

  // Only required when streaming connects after a PUSH_RETRYABLE_ERROR.
  // Otherwise it is unnecessary (e.g, STREAMING_RESUMED).
  pushEmitter.on(PUSH_SUBSYSTEM_UP, () => {
    connectPushRetryBackoff.reset();
    stopWorkers();
  });

  /** Fallbacking without retry due to STREAMING_DISABLED control event, 'pushEnabled: false', and non-recoverable SSE and Authentication errors */

  pushEmitter.on(PUSH_NONRETRYABLE_ERROR, function handleNonRetryableError() {
    // Note: `stopWorkers` is been called twice, but it is not harmful
    disconnectPush();
    pushEmitter.emit(PUSH_SUBSYSTEM_DOWN); // no harm if polling already
  });

  /** Fallbacking with retry due to recoverable SSE and Authentication errors */

  pushEmitter.on(PUSH_RETRYABLE_ERROR, function handleRetryableError() { // HTTP or network error in SSE connection
    // SSE connection is closed to avoid repeated errors due to retries
    sseClient.close();

    // retry streaming reconnect with backoff algorithm
    let delayInMillis = connectPushRetryBackoff.scheduleCall();

    log.info(`Attempting to reconnect in ${delayInMillis / 1000} seconds.`);

    pushEmitter.emit(PUSH_SUBSYSTEM_DOWN); // no harm if polling already
  });

  /** STREAMING_RESET notification. Unlike a PUSH_RETRYABLE_ERROR, it doesn't emit PUSH_SUBSYSTEM_DOWN to fallback polling */

  pushEmitter.on(ControlTypes.STREAMING_RESET, function handleStreamingReset() {
    if (disconnected) return; // should never happen

    // Minimum required clean-up.
    // `disconnectPush` cannot be called because it sets `disconnected` and thus `connectPush` will not execute
    if (timeoutIdTokenRefresh) clearTimeout(timeoutIdTokenRefresh);

    connectPush();
  });

  /** Functions related to synchronization (Queues and Workers in the spec) */

  const producer = context.get(context.constants.PRODUCER);
  const splitUpdateWorker = new SplitUpdateWorker(storage.splits, producer, splitsEventEmitter);
  let segmentUpdateWorker; // used in Node

  // cancel scheduled fetch retries of Split, Segment, and MySegment Update Workers
  function stopWorkers() {
    splitUpdateWorker.backoff.reset();
    if (segmentUpdateWorker) segmentUpdateWorker.backoff.reset();
    forOwn(clients, ({ worker }) => worker.backoff.reset());
  }

  pushEmitter.on(SPLIT_KILL, splitUpdateWorker.killSplit);
  pushEmitter.on(SPLIT_UPDATE, splitUpdateWorker.put);

  if (clientContexts) { // browser
    pushEmitter.on(MY_SEGMENTS_UPDATE, function handleMySegmentsUpdate(parsedData, channel) {
      const userKeyHash = channel.split('_')[2];
      const userKey = userKeyHashes[userKeyHash];
      if (userKey && clientContexts[userKey]) { // check context since it can be undefined if client has been destroyed
        const mySegmentSync = clientContexts[userKey].get(context.constants.MY_SEGMENTS_CHANGE_WORKER, true);
        mySegmentSync && mySegmentSync.put(
          parsedData.changeNumber,
          parsedData.includesPayload ? parsedData.segmentList ? parsedData.segmentList : [] : undefined);
      }
    });

    pushEmitter.on(MY_SEGMENTS_UPDATE_V2, function handleMySegmentsUpdate(parsedData) {
      switch (parsedData.u) {
        case BoundedFetchRequest: {
          let bitmap;
          try {
            bitmap = parseBitmap(parsedData.d, parsedData.c);
          } catch (e) {
            log.warn(fallbackWarning('BoundedFetchRequest', e));
            break;
          }

          forOwn(clients, ({ hash64, worker }) => {
            if (isInBitmap(bitmap, hash64.hex)) {
              worker.put(parsedData.changeNumber); // fetch mySegments
            }
          });
          return;
        }
        case KeyList: {
          let keyList, added, removed;
          try {
            keyList = parseKeyList(parsedData.d, parsedData.c);
            added = new _Set(keyList.a);
            removed = new _Set(keyList.r);
          } catch (e) {
            log.warn(fallbackWarning('KeyList', e));
            break;
          }

          forOwn(clients, ({ hash64, worker }) => {
            const add = added.has(hash64.dec) ? true : removed.has(hash64.dec) ? false : undefined;
            if (add !== undefined) {
              worker.put(parsedData.changeNumber, {
                name: parsedData.segmentName,
                add
              });
            }
          });
          return;
        }
        case SegmentRemoval:
          if (!parsedData.segmentName) {
            log.warn(fallbackWarning('SegmentRemoval', 'No segment name was provided'));
            break;
          }

          forOwn(clients, ({ worker }) => {
            worker.put(parsedData.changeNumber, {
              name: parsedData.segmentName,
              add: false
            });
          });
          return;
      }

      // `UpdateStrategy.UnboundedFetchRequest` and fallbacks of other cases
      forOwn(clients, ({ worker }) => {
        worker.put(parsedData.changeNumber);
      });
    });

  } else { // node
    segmentUpdateWorker = new SegmentUpdateWorker(storage.segments, producer);
    pushEmitter.on(SEGMENT_UPDATE, segmentUpdateWorker.put);
  }

  return objectAssign(
    // Expose Event Emitter functionality and Event constants
    Object.create(pushEmitter),
    {
      // Expose functionality for starting and stoping push mode:
      stop: disconnectPush, // `handleNonRetryableError` cannot be used as `stop`, because it emits PUSH_SUBSYSTEM_DOWN event, which start polling.

      // used in node
      start: connectPush,

      // used in browser
      startNewClient(userKey, context) {
        const hash = hashUserKey(userKey);
        const storage = context.get(context.constants.STORAGE);
        const producer = context.get(context.constants.PRODUCER);

        if (!userKeyHashes[hash]) {
          userKeyHashes[hash] = userKey;
          connectForNewClient = true; // we must reconnect on start, to listen the channel for the new user key
        }
        const mySegmentSync = new SegmentUpdateWorker(storage.segments, producer);
        clients[userKey] = { worker: mySegmentSync, hash64: hash64(userKey) };
        context.put(context.constants.MY_SEGMENTS_CHANGE_WORKER, mySegmentSync);

        // Reconnects in case of a new client.
        // Run in next event-loop cycle to save authentication calls
        // in case the user is creating several clients in the current cycle.
        setTimeout(function checkForReconnect() {
          if (connectForNewClient) {
            connectForNewClient = false;
            connectPush();
          }
        }, 0);

      },
      removeClient(userKey) {
        const hash = hashUserKey(userKey);
        delete userKeyHashes[hash];
        delete clients[userKey];
      }
    }
  );
}
