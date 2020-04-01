import SSEClient from '../SSEClient';
import authenticate from '../AuthClient';
import NotificationProcessorFactory from '../NotificationProcessor';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-pushmanager');
import splitSyncFactory from '../SplitSync';
import segmentSyncFactory from '../SegmentSync';
import checkPushSupport from './checkPushSupport';
import Backoff from '../../utils/backoff';
import { hashUserKey } from '../../utils/jwt/hashUserKey';
import EventEmitter from 'events';
import { PushEventTypes, SECONDS_BEFORE_EXPIRATION } from '../constants';

/**
 * Factory of the push mode manager.
 *
 * @param {*} feedbackLoop callback functions for streaming up or down.
 *  interface feedbackLoop {
 *    onPushConnect: () => void,
 *    onPushDisconnect: () => void,
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
export default function PushManagerFactory(context, clientContexts /* undefined for node */) {

  const pushEmitter = new EventEmitter();
  pushEmitter.Event = PushEventTypes;

  // No return a PushManager if PUSH mode is not supported.
  if (!checkPushSupport(log))
    return;

  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);
  const sseClient = SSEClient.getInstance(settings);

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
    authenticate(settings, clientContexts ? Object.keys(clientContexts) : undefined).then(
      function (authData) {
        reauthBackoff.reset(); // restart attempts counter for reauth due to HTTP/network errors
        if (!authData.pushEnabled) {
          log.error('Streaming is not enabled for the organization. Switching to polling mode.');
          pushEmitter.emit(Event.PUSH_DISCONNECT); // there is no need to close sseClient (it is not open on this scenario)
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
        pushEmitter.emit(Event.PUSH_DISCONNECT); // no harm if `PUSH_DISCONNECT` was already notified

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

  /** initialization */
  const userKeyHashes = {};

  const notificationProcessor = NotificationProcessorFactory(
    sseClient,
    pushEmitter,
    settings.streamingReconnectBackoffBase);
  sseClient.setEventHandler(notificationProcessor);

  /** Functions related to synchronization according to the spec (Queues and Workers) */
  const producer = context.get(context.constants.PRODUCER, true);
  const splitSync = splitSyncFactory(storage.splits, producer);

  pushEmitter.on(PushEventTypes.SPLIT_KILL, splitSync.killSplit);
  pushEmitter.on(PushEventTypes.SPLIT_UPDATE, splitSync.queueSyncSplits);

  if (clientContexts) { // browser
    pushEmitter.on(PushEventTypes.MY_SEGMENTS_UPDATE, function handleMySegmentsUpdate(eventData, channel) {
      // @TODO move function outside and test
      const userKeyHash = channel.split('_')[2];
      const userKey = userKeyHashes[userKeyHash];
      if (userKey && clientContexts[userKey]) { // check context since it can be undefined if client has been destroyed
        const mySegmentSync = clientContexts[userKey].get(context.constants.MY_SEGMENTS_CHANGE_WORKER, true);
        mySegmentSync && mySegmentSync.queueSyncMySegments(
          eventData.changeNumber,
          eventData.includesPayload ? eventData.segmentList : undefined);
      }
    });
  } else { // node
    const segmentSync = segmentSyncFactory(storage.segments, producer);
    pushEmitter.on(PushEventTypes.SEGMENT_UPDATE, segmentSync.queueSyncSegments);
  }

  return Object.assign(
    // Expose Event Emitter functionality and Event constants
    Object.create(pushEmitter),
    {

      // Expose functionality for starting and stoping push mode:

      stop() { // same producer passed to NodePushManagerFactory
        // remove listener, so that when connection is closed, polling mode is not started.
        sseClient.setEventHandler(undefined);
        sseClient.close();
      },

      start: connectPush,

      // used in browser
      addClient(userKey, context) {
        const hash = hashUserKey(userKey);
        userKeyHashes[hash] = userKey;
        const storage = context.get(context.constants.STORAGE);
        const producer = context.get(context.constants.PRODUCER);
        context.put(context.constants.MY_SEGMENTS_CHANGE_WORKER, segmentSyncFactory(storage.segments, producer));
      },
      removeClient(userKey) {
        const hash = hashUserKey(userKey);
        delete userKeyHashes[hash];
      }
    }
  );
}