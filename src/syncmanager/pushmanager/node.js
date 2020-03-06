import SSEClient from '../sseclient';
import AuthClient from '../authclient';
import FeedbackLoopFactory from '../feedbackloop';
import NotificationProcessorFactory from '../notificationprocessor';
import logFactory from './utils/logger';
const log = logFactory('splitio-pushmanager');

export default function NodePushManagerFactory(context, producer) {

  // @REVIEW we can also do `const sseClient = new SSEClient();` inside a try-catch
  // in case the constructor cannot build an instance (when EventSource is not available)
  const sseClient = SSEClient.getInstance();

  // No return PushManager if sseClient (i.e., EventSource) is not available
  if (!sseClient) {
    // @TODO log some warning: 'EventSource not available. fallback to polling';
    return undefined;
  }

  const authClient = new AuthClient();

  function scheduleNextTokenRefresh(ttl) {
    // @TODO calculate delay
    const delay = ttl;
    scheduleReconnect(delay);
  }
  function scheduleNextReauth() {
    // @TODO calculate delay
    const delay = 100000;
    scheduleReconnect(delay);
  }

  let timeoutID = 0;
  function scheduleReconnect(delay) {
    // @REVIEW is there some scenario where `clearScheduledReconnect` must be explicitly called?
    // cancel a scheduled reconnect if previously established, since `scheduleReconnect` is invoked on different scenarios:
    // - initial connect
    // - scheduled connects for refresh token, auth errors and sse errors.
    if (timeoutID) clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      connect();
    }, delay);
  }

  function connect() {
    authClient.authenticate(context.core.authorizationKey).then(
      function (token) {
        sseClient.open(token.jwt, token.channels);
        scheduleNextTokenRefresh(token.ttl);
      }
    ).catch(
      function (error) {
        // @TODO: review:
        //  log messages for invalid token, 'streaming not enabled for this org', http errors, etc.
        //  should we re-schedule a connect call when 'streaming not enabled for this org'
        //  (in case streaming is enabled for that call) or http errors?
        log.error(error);

        sseClient.close();
        scheduleNextReauth();
      }
    );
  }

  // @REVIEW FeedbackLoopFactory and NotificationProcessorFactory can be JS classes
  const feedbackLoop = FeedbackLoopFactory(producer, connect);
  const notificationProcessor = NotificationProcessorFactory(feedbackLoop);
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
  };
}