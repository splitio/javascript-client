import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import { matching } from '../utils/key/factory';
import { forOwn } from '../utils/lang';
import { SETTINGS, PRODUCER } from '../utils/context/constants';

/**
 * Factory of sync manager for browser
 *
 * @param context main client context
 */
export default function BrowserSyncManagerFactory(context) {

  const mainContext = context;
  const contexts = {};

  function startPolling() {
    forOwn(contexts, function (context) {
      const producer = context.get(PRODUCER, true);
      if (producer && !producer.isRunning())
        producer.start();
    });
  }

  function stopPollingAndSyncAll() {
    // if polling, stop
    forOwn(contexts, function (context) {
      const producer = context.get(PRODUCER, true);
      if (producer && producer.isRunning())
        producer.stop();
    });
    syncAll();
  }

  function syncAll() {
    // fetch splits and segments
    const mainProducer = mainContext.get(PRODUCER, true);
    mainProducer && mainProducer.callSplitsUpdater();
    // @TODO review precence of segments to run mySegmentUpdaters
    forOwn(contexts, function (context) {
      const producer = context.get(PRODUCER, true);
      producer && producer.callMySegmentsUpdater();
    });
  }

  let pushManager;
  const settings = context.get(SETTINGS);
  if (settings.streamingEnabled) {
    pushManager = PushManagerFactory({
      onPushConnect: stopPollingAndSyncAll,
      onPushDisconnect: startPolling,
    }, mainContext, contexts);
  }

  return {
    createSync(context, isSharedClient) {
      const producer = isSharedClient ? PartialProducerFactory(context) : FullProducerFactory(context);
      context.put(PRODUCER, producer);
      const settings = context.get(SETTINGS);
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
    },
  };
}