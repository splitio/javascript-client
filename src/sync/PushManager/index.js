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
import { SECONDS_BEFORE_EXPIRATION, PUSH_SUBSYSTEM_DOWN, PUSH_SUBSYSTEM_UP, PUSH_NONRETRYABLE_ERROR, PUSH_RETRYABLE_ERROR, SPLIT_KILL, SPLIT_UPDATE, SEGMENT_UPDATE, MY_SEGMENTS_UPDATE } from '../constants';

const log = logFactory('splitio-sync:push-manager');

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
  const sseClient = SSEClient.getInstance(settings);
  const sseHandler = SSEHandlerFactory(pushEmitter);
  sseClient.setEventHandler(sseHandler);

  // map of hashes to user keys, to dispatch MY_SEGMENTS_UPDATE events to the corresponding MySegmentsUpdateWorker
  const userKeyHashes = {};
  // list of workers, used to stop them all together when push is disconnected
  const workers = [];
  // variable used on browser to reconnect only when a new client was added, saving some authentication and sse connections.
  let connectForNewClient = false;
  // flag that indicates if `disconnectPush` was called, either by the SyncManager (when the client is destroyed) or by a PUSH_NONRETRYABLE_ERROR error
  let disconnected;

  /** PushManager functions related to initialization */

  const connectPushRetryBackoff = new Backoff(connectPush, settings.scheduler.pushRetryBackoffBase);

  let timeoutId;

  function scheduleTokenRefresh(issuedAt, expirationTime) {
    // clear scheduled token refresh if exists (needed when resuming PUSH)
    if (timeoutId) clearTimeout(timeoutId);

    // Set token refresh 10 minutes before expirationTime
    const delayInSeconds = expirationTime - issuedAt - SECONDS_BEFORE_EXPIRATION;

    log.info(`Refreshing streaming token in ${delayInSeconds} seconds.`);

    timeoutId = setTimeout(connectPush, delayInSeconds * 1000);
  }

  function connectPush() {
    disconnected = false;
    log.info('Connecting to push streaming.');

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

        // Connect to SSE and schedule refresh token
        const decodedToken = authData.decodedToken;
        sseClient.open(authData);
        scheduleTokenRefresh(decodedToken.iat, decodedToken.exp);
      }
    ).catch(
      function (error) {
        if (disconnected) return;

        log.error(`Failed to authenticate for streaming. Error: "${error.message}".`);

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
    disconnected = true;
    log.info('Disconnecting from push streaming.');
    sseClient.close();

    if (timeoutId) clearTimeout(timeoutId);
    connectPushRetryBackoff.reset();

    stopWorkers();
  }

  // cancel scheduled fetch retries of Split, Segment, and MySegment Update Workers
  function stopWorkers() {
    workers.forEach(worker => worker.backoff.reset());
  }

  pushEmitter.on(PUSH_SUBSYSTEM_DOWN, stopWorkers);

  // restart backoff retry counter once push is connected
  pushEmitter.on(PUSH_SUBSYSTEM_UP, () => { connectPushRetryBackoff.reset(); });

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

  /** Functions related to synchronization (Queues and Workers in the spec) */

  const producer = context.get(context.constants.PRODUCER);
  const splitUpdateWorker = new SplitUpdateWorker(storage.splits, producer, splitsEventEmitter);

  workers.push(splitUpdateWorker);
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
  } else { // node
    const segmentUpdateWorker = new SegmentUpdateWorker(storage.segments, producer);
    workers.push(segmentUpdateWorker);
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
        workers.push(mySegmentSync);
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
      }
    }
  );
}