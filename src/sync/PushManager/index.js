import SSEClient from '../SSEClient';
import authenticate from '../AuthClient';
import NotificationProcessorFactory from '../NotificationProcessor';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-pushmanager');
import splitSyncFactory from '../SplitSync';
import segmentSyncFactory from '../SegmentSync';
import checkPushSupport from './checkPushSupport';
import Backoff from '../../utils/backoff';

const SECONDS_BEFORE_EXPIRATION = 600;

/**
 * Factory of the push mode manager.
 *
 * @param {*} syncManager reference to syncManager for callback functions (feedback loop).
 *  interface syncManager {
 *    startPolling: () => void,
 *    stopPolling: () => void,
 *    syncAll: () => void,
 *  }
 * @param {*} context context of main client.
 * @param {*} producer producer of main client (/produce/node or /producer/browser/full).
 * @param {*} clients object with client information to handle mySegments synchronization. undefined for node.
 *  interface clients {
 *    userKeys: { [userKey: string]: string },
 *    userKeyHashes: { [userKeyHash: string]: string },
 *    clients: { [userKey: string]: Object },
 *  }
 */
export default function PushManagerFactory(syncManager, context, producer, clients) {

  // No return a PushManager if PUSH mode is not supported.
  if (!checkPushSupport(log))
    return;

  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);
  const sseClient = SSEClient.getInstance(settings);

  /** Functions used to handle mySegments synchronization for browser */

  /** PushManager functions, according to the spec */

  const authRetryBackoffBase = settings.authRetryBackoffBase;
  const reauthBackoff = new Backoff(connectPush, authRetryBackoffBase);

  let timeoutID = 0;
  function scheduleNextTokenRefresh(issuedAt, expirationTime) {
    // Set token refresh 10 minutes before expirationTime
    const delayInSeconds = expirationTime - issuedAt - SECONDS_BEFORE_EXPIRATION;

    // @TODO review if there is some scenario where clearTimeout must be explicitly called
    // cancel a scheduled reconnect if previously established, since `scheduleReconnect` is invoked on different scenarios:
    // - initial connect
    // - scheduled connects for refresh token, auth errors and sse errors.
    if (timeoutID) clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      connectPush();
    }, delayInSeconds * 1000);
  }

  function connectPush() {
    authenticate(settings, clients ? clients.userKeys : undefined).then(
      function (authData) {
        reauthBackoff.reset(); // restart attempts counter for reauth due to HTTP/network errors
        if (!authData.pushEnabled) {
          log.error('Streaming is not enabled for the organization. Switching to polling mode.');
          syncManager.startPolling(); // there is no need to close sseClient (it is not open on this scenario)
          return;
        }

        // Connect to SSE and schedule refresh token
        const decodedToken = authData.decodedToken;
        sseClient.open(authData);
        scheduleNextTokenRefresh(decodedToken.iat, decodedToken.exp);
      }
    ).catch(
      function (error) {

        sseClient.close();
        syncManager.startPolling(); // no harm if already in polling mode

        if (error.statusCode) {
          switch (error.statusCode) {
            case 401: // invalid api key
              log.error(error.message);
              return;
          }
        }
        // Branch for other HTTP and network errors
        log.error(error);
        reauthBackoff.scheduleCall();
      }
    );
  }

  /** Functions related to synchronization according to the spec (Queues and Workers) */

  const splitSync = splitSyncFactory(storage.splits, producer);

  const segmentSync = clients ?
    segmentSyncFactory(clients.clients) : // browser mySegmentsSync
    segmentSyncFactory(storage.segments, producer); // node segmentSync

  /** initialization */

  const notificationProcessor = NotificationProcessorFactory(
    sseClient,
    syncManager, // feedback loop
    // SyncWorkers
    splitSync,
    segmentSync,
    settings.streamingReconnectBackoffBase,
    clients ? clients.userKeyHashes : undefined);
  sseClient.setEventHandler(notificationProcessor);

  return {
    stopPush() { // same producer passed to NodePushManagerFactory
      // remove listener, so that when connection is closed, polling mode is not started.
      sseClient.setEventHandler(undefined);
      sseClient.close();
    },
    connectPush,
  };
}