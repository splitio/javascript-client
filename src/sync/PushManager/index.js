import EventEmitter from 'events';

import authenticate from '../AuthClient';
import { checkPushRequirements } from './pushRequirements';
import SegmentUpdateWorker from '../SegmentUpdateWorker';
import SplitUpdateWorker from '../SplitUpdateWorker';
import SSEClient from '../SSEClient';
import SSEHandlerFactory from '../SSEHandler';

import Backoff from '../../utils/backoff';
import { hashUserKey } from '../../utils/jwt/hashUserKey';
import logFactory from '../../utils/logger';
import { SECONDS_BEFORE_EXPIRATION, PUSH_DISCONNECT, PUSH_DISABLED, SSE_ERROR, SPLIT_KILL, SPLIT_UPDATE, SEGMENT_UPDATE, MY_SEGMENTS_UPDATE } from '../constants';

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
  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);
  const sseClient = SSEClient.getInstance(settings);
  const sseHandler = SSEHandlerFactory(pushEmitter);
  sseClient.setEventHandler(sseHandler);

  // map of hashes to user keys, to dispatch MY_SEGMENTS_UPDATE events to the corresponding MySegmentsUpdateWorker
  const userKeyHashes = {};
  // variable used on browser to reconnect only when a new client was added, saving some authentication and sse connections.
  let connectForNewClient = false;

  /** PushManager functions related to initialization */

  const reauthBackoff = new Backoff(connectPush, settings.authRetryBackoffBase);
  const sseReconnectBackoff = new Backoff(sseClient.reopen.bind(sseClient), settings.streamingReconnectBackoffBase);

  let timeoutId = 0;

  function scheduleTokenRefresh(issuedAt, expirationTime) {
    // clear scheduled token refresh if exists (needed when resuming PUSH)
    if (timeoutId) clearTimeout(timeoutId);

    // Set token refresh 10 minutes before expirationTime
    const delayInSeconds = expirationTime - issuedAt - SECONDS_BEFORE_EXPIRATION;

    timeoutId = setTimeout(connectPush, delayInSeconds * 1000);
  }

  function connectPush() {
    log.info('Connecting to push streaming.');

    const userKeys = clientContexts ? Object.keys(clientContexts) : undefined;
    authenticate(settings, userKeys).then(
      function (authData) {
        // restart backoff retry counter for auth and SSE connections, due to HTTP/network errors
        reauthBackoff.reset();
        sseReconnectBackoff.reset(); // reset backoff in case SSE conexion has opened after a HTTP or network error.

        // emit PUSH_DISCONNECT if org is not whitelisted
        if (!authData.pushEnabled) {
          log.error('Streaming is not enabled for the organization. Switching to polling mode.');
          pushEmitter.emit(PUSH_DISCONNECT); // there is no need to close sseClient (it is not open on this scenario)
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

        sseClient.close(); // no harm if already disconnected
        pushEmitter.emit(PUSH_DISCONNECT); // no harm if `PUSH_DISCONNECT` was already notified

        if (error.statusCode) {
          switch (error.statusCode) {
            case 401: // invalid api key
              log.error(`Fail to authenticate for push notifications, with error message: "${error.message}".`);
              return;
          }
        }

        // Branch for other HTTP and network errors
        const delayInMillis = reauthBackoff.scheduleCall();
        log.error(`Fail to authenticate for push notifications, with error message: "${error.message}". Attempting to reauthenticate in ${delayInMillis / 1000} seconds.`);
      }
    );
  }

  function disconnectPush() {
    sseClient.close();

    // cancel timeouts if previously established
    if (timeoutId) clearTimeout(timeoutId);
    reauthBackoff.reset();
    sseReconnectBackoff.reset();
  }

  /** Fallbacking due to STREAMING_DISABLED control event */

  pushEmitter.on(PUSH_DISABLED, function () {
    disconnectPush();
    pushEmitter.emit(PUSH_DISCONNECT); // no harm if polling already
  });

  /** Fallbacking due to SSE errors */

  pushEmitter.on(SSE_ERROR, function (error) { // HTTP or network error in SSE connection
    // SSE connection is closed to avoid repeated errors due to retries
    sseClient.close();

    // retries are handled via backoff algorithm
    let delayInMillis;
    if (error.parsedData && (error.parsedData.statusCode === 400 || error.parsedData.statusCode === 401)) {
      delayInMillis = reauthBackoff.scheduleCall(); // reauthenticate in case of token invalid or expired (when somehow refresh token was not properly executed)
    } else {
      delayInMillis = sseReconnectBackoff.scheduleCall(); // reconnect SSE for any other network or HTTP error
    }

    const errorMessage = error.parsedData && error.parsedData.message;
    log.error(`Fail to connect to streaming${errorMessage ? `, with error message: "${errorMessage}"` : ''}. Attempting to reconnect in ${delayInMillis / 1000} seconds.`);

    pushEmitter.emit(PUSH_DISCONNECT); // no harm if polling already
  });

  /** Functions related to synchronization (Queues and Workers in the spec) */

  const producer = context.get(context.constants.PRODUCER);
  const splitUpdateWorker = new SplitUpdateWorker(storage.splits, producer);

  pushEmitter.on(SPLIT_KILL, splitUpdateWorker.killSplit.bind(splitUpdateWorker));
  pushEmitter.on(SPLIT_UPDATE, splitUpdateWorker.put.bind(splitUpdateWorker));

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
    pushEmitter.on(SEGMENT_UPDATE, segmentUpdateWorker.put.bind(segmentUpdateWorker));
  }

  return Object.assign(
    // Expose Event Emitter functionality and Event constants
    Object.create(pushEmitter),
    {
      // Expose functionality for starting and stoping push mode:
      stop: disconnectPush,

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
        context.put(context.constants.MY_SEGMENTS_CHANGE_WORKER, new SegmentUpdateWorker(storage.segments, producer));

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