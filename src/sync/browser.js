import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import { matching } from '../utils/key/factory';
import { forOwn } from '../utils/lang';

/**
 * Factory of sync manager for browser
 *
 * @param context main client context
 */
export default function BrowserSyncManagerFactory(context) {

  const mainContext = context;
  const contexts = {};
  let pushManager;

  function startPolling() {
    forOwn(contexts, function (context) {
      const producer = context.get(context.constants.PRODUCER, true);
      if (producer && !producer.isRunning())
        producer.start();
    });
  }

  function stopPollingAndSyncAll() {
    // if polling, stop
    forOwn(contexts, function (context) {
      const producer = context.get(context.constants.PRODUCER, true);
      if (producer && producer.isRunning())
        producer.stop();
    });
    syncAll();
  }

  function syncAll() {
    // fetch splits and segments
    const mainProducer = mainContext.get(context.constants.PRODUCER, true);
    mainProducer && mainProducer.callSplitsUpdater();
    // @TODO review precence of segments to run mySegmentUpdaters
    forOwn(contexts, function (context) {
      const producer = context.get(context.constants.PRODUCER, true);
      producer && producer.callMySegmentsUpdater();
    });
  }

  function shared(context, isSharedClient = true) {
    const producer = isSharedClient ? PartialProducerFactory(context) : FullProducerFactory(context);
    context.put(context.constants.PRODUCER, producer);
    const settings = context.get(context.constants.SETTINGS);
    const userKey = matching(settings.core.key);
    contexts[userKey] = context;

    return {
      start() {
        // start syncing
        if (pushManager) {
          if (!isSharedClient) syncAll(); // initial syncAll (only when main client is created)
          pushManager.addClient(userKey, context); // reconnects in case of a new shared client
        } else {
          producer.start();
        }
      },

      stop() {
        const context = contexts[userKey];
        if (context) { // check in case `client.destroy()` has been invoked more than once for the same client
          delete contexts[userKey];

          if (pushManager) {
            pushManager.removeClient(userKey);
            // stop push if stoping main client
            if (!isSharedClient)
              pushManager.stopPush();
          }

          if (producer && producer.isRunning())
            producer.stop();
          // We don't reconnect pushmanager when removing a client,
          // since it is more costly than continue listening the channel
        }
      }
    };
  }

  // called before creating PushManager, to create the producer and put in context.
  const result = shared(context, false);

  const settings = context.get(context.constants.SETTINGS);
  if (settings.streamingEnabled) {
    pushManager = PushManagerFactory({
      onPushConnect: stopPollingAndSyncAll,
      onPushDisconnect: startPolling,
    }, mainContext, contexts);
  }

  // for main client we return a SyncManager with 3 methods: start, stop and shared. The last is used to instantiate "partial SyncManagers".
  result.shared = shared;
  return result;
}