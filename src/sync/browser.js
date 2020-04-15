import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import { matching } from '../utils/key/factory';
import { forOwn } from '../utils/lang';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-sync:sync-manager');

/**
 * Factory of sync manager for browser
 *
 * @param context main client context
 */
export default function BrowserSyncManagerFactory(mainContext) {

  const contexts = {};
  let pushManager;

  function startPolling() {
    log.info('PUSH down or disconnected. Starting periodic fetch of data.');
    forOwn(contexts, function (context) {
      const producer = context.get(context.constants.PRODUCER, true);
      if (producer && !producer.isRunning())
        producer.start(true); // `fetchers` are scheduled but not called immediately
    });
  }

  function stopPollingAndSyncAll() {
    log.info('PUSH (re)connected. Syncing and stopping periodic fetch of data.');
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
    const mainProducer = mainContext.get(mainContext.constants.PRODUCER, true);
    mainProducer && mainProducer.synchronizeSplits();
    // @TODO review precence of segments to run mySegmentUpdaters
    forOwn(contexts, function (context) {
      const producer = context.get(context.constants.PRODUCER, true);
      producer && producer.synchronizeMySegments();
    });
  }

  function shared(context, isSharedClient = true) {
    const producer = isSharedClient ? PartialProducerFactory(context) : FullProducerFactory(context);
    context.put(context.constants.PRODUCER, producer);
    const settings = context.get(context.constants.SETTINGS);
    const userKey = matching(settings.core.key);
    if(contexts[userKey]) log.warn('A client with the same user key has already been created. Only the new instance will be properly synchronized.');
    contexts[userKey] = context;

    return {
      start() {
        // start syncing
        if (pushManager) {
          if (!isSharedClient) {
            syncAll(); // initial syncAll (only when main client is created)
            pushManager.on(pushManager.Event.PUSH_CONNECT, stopPollingAndSyncAll);
            pushManager.on(pushManager.Event.PUSH_DISCONNECT, startPolling);
          }
          pushManager.startNewClient(userKey, context);
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
              pushManager.stop();
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
  const result = shared(mainContext, false);

  const settings = mainContext.get(mainContext.constants.SETTINGS);
  if (settings.streamingEnabled)
    pushManager = PushManagerFactory(mainContext, contexts);

  // for main client we return a SyncManager with 3 methods: start, stop and shared. The last is used to instantiate "partial SyncManagers".
  result.shared = shared;
  return result;
}