import SSEClient from '../sseclient';
import AuthClient from '../authclient';
import NotificationProcessor from '../notificationprocessor';
import logFactory from './utils/logger';
const log = logFactory('splitio-pushmanager');

export default function NodePushManagerFactory(context) {

  // @REVIEW we can also do `const sseClient = new SSEClient();` inside a try-catch
  // in case the constructor cannot build an instance (when EventSource is not available)
  const sseClient = SSEClient.getInstance();

  // No return PushManager if sseClient (i.e., EventSource) is not available
  if (!sseClient) {
    // @TODO log some warning: 'EventSource not available. fallback to polling';
    return undefined;
  }

  const authClient = new AuthClient();

  // fetch splits and segments.
  // @TODO we should move to SyncManager for compliance with spec (SyncManager->Synchronizer.syncAll)
  function syncAll(producer) {
    producer.callSplitsUpdater();
    producer.callSegmentsUpdater();
  }

  function handleSSEConnectionReady(producer, open) { // eventsource.onopen
    // @REVIEW should we log something, and do we get some info from the open event?
    log.info(open);

    syncAll(producer);
  }

  function handleSSEConnectionError(producer, error) { // eventsource.onerror
    // @TODO review if something else is needed, and how to log the error
    log.error(error);

    fallBackToPolling(producer);
    sseClient.close();
  }

  // @REVIEW do we have the need of implementing a 'undoScheduleNextTokenRefresh' ?
  function scheduleNextTokenRefresh(ttl, producer) {
    // @TODO calculate delay
    const delay = ttl;

    setTimeout(() => {
      initialization(producer);
    }, delay);
  }

  function initialization(producer) {
    authClient.authenticate(context.core.authorizationKey).then(
      function (token) {
        // necessary when switching from polling to push mode. E.g.: successful re-auth  after a fail auth.
        stopPolling();

        syncAll(producer);

        // @TODO move to SSEClient
        // @REVIEW do we need to distinguish connect from disconnect? SSEClient can internally handle it, and we can abstract message processor from that.
        let newConnection = sseClient.open(token.jwt, token.channels);
        newConnection.onopen = handleSSEConnectionReady.bind(this, producer);
        newConnection.onmessage = NotificationProcessor.bind(this, producer);
        newConnection.onerror = handleSSEConnectionError.bind(this, producer);

        scheduleNextTokenRefresh(token.ttl);
      }
    ).catch(
      function (error) {
        // @TODO: review:
        //  log messages for invalid token, 'streaming not enabled for this org', http errors, etc.
        //  should we re-schedule a initialization call when 'streaming not enabled for this org'
        //  (in case streaming is enabled for that call) or http errors?
        log.error(error);

        fallBackToPolling(producer);
        sseClient.close();
      }
    );
  }

  function fallBackToPolling(producer) {
    if (!producer.isRunning())
      producer.start();
  }

  function stopPolling(producer) {
    if (producer.isRunning())
      producer.stop();
  }

  return {
    // Perform initialization phase
    startFullProducer(producer) {
      initialization(producer);
    },

    stopFullProducer(producer) {
      stopPolling(producer);
      sseClient.close();
    },
  };
}