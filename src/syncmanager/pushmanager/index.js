import SSEClient from '../sseclient';
import authenticate from '../authclient';
import NotificationProcessorFactory from '../notificationprocessor';
import { hashUserKey } from '../../utils/push';
import { forOwn } from '../../utils/lang';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-pushmanager');

/**
 * Factory of the push mode manager.
 *
 * @param {*} context context of the main client
 * @param {*} producer producer of the main client
 * @param {*} userKey user key of the main client for browser. `undefined` for node.
 */
export default function PushManagerFactory(context, producer, userKey) {

  const sseClient = SSEClient.getInstance();

  // No return a PushManager if sseClient could not be created, due to the lack of EventSource API.
  if (!sseClient) {
    log.warn('EventSource API is not available. Fallback to polling mode');
    return undefined;
  }

  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);

  /** Functions used to handle mySegments synchronization for browser */

  // userKeys contain the set of keys used for authentication on client-side. The object stay empty in server-side.
  const userKeys = {};
  // userKeyHashes contain the list of key hashes used by NotificationProcessor to map MY_SEGMENTS_UPDATE channels to userKey
  const userKeyHashes = {};
  // reference to producers, to handle synchronization
  const partialProducers = {};

  function addPartialProducer(userKey, producer) {
    partialProducers[userKey] = producer;
    const hash = hashUserKey(userKey);
    userKeys[userKey] = hash;
    userKeyHashes[hash] = userKey;
  }
  function removePartialProducer(userKey, producer) {
    delete partialProducers[userKey];
    delete userKeyHashes[userKeys[userKey]];
    delete userKeys[userKey];

    if (producer.isRunning())
      producer.stop();
  }

  // for browser:
  // - add main producer as `partialproducer` to handle mySegments synchronization as a partial producer
  // - update `syncingMySegments` flag, to perform synchronization of mySegments updaters
  let syncingMySegments = false;
  if (userKey) {
    addPartialProducer(userKey, producer);
    const { splits: splitsEventEmitter } = context.get(context.constants.READINESS);
    splitsEventEmitter.on(splitsEventEmitter.SDK_SPLITS_ARRIVED, function () {
      syncingMySegments = storage.splits.usesSegments();
    });
  }

  /** PushManager functions, according to the spec */

  function scheduleNextTokenRefresh(issuedAt, expirationTime) {
    // @REVIEW calculate delay. Currently set one minute less than delta.
    const delayInSeconds = expirationTime - issuedAt - 60;
    scheduleReconnect(delayInSeconds * 1000);
  }
  function scheduleNextReauth() {
    // @TODO calculate delay
    const delayInSeconds = 60;
    scheduleReconnect(delayInSeconds);
  }

  let timeoutID = 0;
  function scheduleReconnect(delayInMillis) {
    // @REVIEW is there some scenario where `clearScheduledReconnect` must be explicitly called?
    // cancel a scheduled reconnect if previously established, since `scheduleReconnect` is invoked on different scenarios:
    // - initial connect
    // - scheduled connects for refresh token, auth errors and sse errors.
    if (timeoutID) clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      connect();
    }, delayInMillis);
  }

  function connect() {
    authenticate(settings, syncingMySegments ? userKeys : undefined).then(
      function (authData) {
        if (!authData.pushEnabled)
          throw new Error('Streaming is not enabled for the organization');

        // Connect to SSE and schedule refresh token
        const decodedToken = authData.decodedToken;
        sseClient.open(authData);
        scheduleNextTokenRefresh(decodedToken.iat, decodedToken.exp);
      }
    ).catch(
      function (error) {
        // @TODO: review:
        //  log messages for invalid token, 'Streaming is not enabled for the organization', http errors, etc.
        //  should we re-schedule a connect call when http errors or 'Streaming is not enabled for the organization'
        //  (in case push is enabled for that call)?
        log.error(error);

        sseClient.close();
        scheduleNextReauth();
      }
    );
  }

  /** Feedbackloop functions, according to the spec */

  function startPolling() {
    // producer will have a single producer in node, and the list of partialProducers in browser
    const producers = userKey ? partialProducers : { 'node': producer };

    forOwn(producers, function (producer) {
      if (!producer.isRunning())
        producer.start();
    });
  }

  function stopPollingAnsSyncAll() {
    // producer will have a single producer in node, and the list of partialProducers in browser
    const producers = userKey ? partialProducers : { 'node': producer };

    forOwn(producers, function (producer) {
      if (producer.isRunning())
        producer.stop();
    });

    // fetch splits and segments.
    producer.callSplitsUpdater();
    if (!userKey) { // node
      producer.callSegmentsUpdater();
    } else { // browser
      forOwn(partialProducers, function (producer) {
        producer.callMySegmentsUpdater();
      });
    }
  }

  /** Functions related to synchronization according to the spec (responsability of Queues and Workers) */

  function killSplit(changeNumber, splitName, defaultTreatment) {
    // @TODO use queue
    producer.callKillSplit(changeNumber, splitName, defaultTreatment);
  }

  function queueSyncSplits(changeNumber) {
    // @TODO use queue
    producer.callSplitsUpdater(changeNumber);
  }

  function queueSyncSegments(changeNumber, segmentName) {
    // @TODO use queue
    producer.callSegmentsUpdater(changeNumber, segmentName);
  }

  function queueSyncMySegments(changeNumber, userKey, segmentList) {
    // @TODO use queue
    if (partialProducers[userKey])
      partialProducers[userKey].callMySegmentsUpdater(changeNumber, segmentList);
  }

  /** initialization */

  const notificationProcessor = NotificationProcessorFactory({
    startPolling,
    stopPollingAnsSyncAll,
    reconnectPush: connect,
    queueSyncSplits,
    queueSyncSegments,
    queueSyncMySegments,
    killSplit,
  }, userKeyHashes);
  sseClient.setEventHandler(notificationProcessor);

  connect();

  return {
    stopFullProducer(producer) { // same producer passed to NodePushManagerFactory
      // remove listener, so that when connection is closed, polling mode is not started.
      sseClient.setListener(undefined);
      sseClient.close();

      if (producer.isRunning())
        producer.stop();
    },

    // Methods used by SyncManager for browser
    addPartialProducer,
    removePartialProducer,
  };
}