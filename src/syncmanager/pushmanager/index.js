import SSEClient from '../sseclient';
import authenticate from '../authclient';
import FeedbackLoopFactory from '../feedbackloop';
import NotificationProcessorFactory from '../notificationprocessor';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-pushmanager');

import murmur from '../../engine/engine/murmur3';
import { encodeToBase64 } from '../../utils/lang';

function hashSplitKey(splitKey) {
  // @REVIEW add some validation for splitKey?
  return encodeToBase64(murmur.hash(splitKey, 0).toString());
}

export default function PushManagerFactory(settings, producer, producerWithMySegmentsUpdater = false) {

  // @REVIEW we can also do `const sseClient = new SSEClient();` inside a try-catch
  // in case the constructor cannot build an instance (when EventSource is not available)
  const sseClient = SSEClient.getInstance();

  // No return PushManager if sseClient (i.e., EventSource) is not available
  if (!sseClient) {
    // @TODO log some warning: 'EventSource not available. fallback to polling';
    return undefined;
  }

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

  // splitKeys contain the set of keys used for authentication on client-side.
  // The object stay empty in server-side
  const splitKeys = {};
  // splitKeyHashes contain the list of key hashes used by NotificationProcessor to map MY_SEGMENTS_UPDATE channels to splitKey
  const splitKeyHashes = {};
  if (producerWithMySegmentsUpdater) {
    const hash = hashSplitKey(settings.core.key);
    splitKeys[settings.core.key] = hash;
    splitKeyHashes[hash] = settings.core.key;
  }

  function connect() {
    authenticate(settings, splitKeys).then(
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

  // @REVIEW FeedbackLoopFactory and NotificationProcessorFactory can be JS classes
  const feedbackLoop = FeedbackLoopFactory(producer, connect);
  const notificationProcessor = NotificationProcessorFactory(feedbackLoop, splitKeyHashes);
  sseClient.setEventListener(notificationProcessor);

  // Perform initialization phase
  connect();

  return {
    stopFullProducer(producer) { // same producer passed to NodePushManagerFactory
      // remove listener, so that when connection is closed, polling mode is not started.
      sseClient.setListener(undefined);
      sseClient.close();

      if (producer.isRunning())
        producer.stop();
    },

    // User by SyncManager for browser
    addProducerWithMySegmentsUpdater(splitKey, producer) {
      feedbackLoop.addProducerWithMySegmentsUpdater(splitKey, producer);

      const hash = hashSplitKey(splitKey);
      splitKeys[splitKey] = hash;
      splitKeyHashes[hash] = splitKey;
    },
    removeProducerWithMySegmentsUpdater(splitKey, producer) {
      feedbackLoop.removeProducerWithMySegmentsUpdater(splitKey, producer);

      delete splitKeyHashes[splitKeys[splitKey]];
      delete splitKeys[splitKey];

      if (producer.isRunning())
        producer.stop();
    },
  };
}