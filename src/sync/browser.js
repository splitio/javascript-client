import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import { matching } from '../utils/key/factory';
import { forOwn, toString } from '../utils/lang';
import logFactory from '../utils/logger';
import { PUSH_SUBSYSTEM_DOWN, PUSH_SUBSYSTEM_UP } from './constants';
const log = logFactory('splitio-sync:sync-manager');

/**
 * Factory of sync manager for browser
 *
 * @param context main client context
 */
export default function BrowserSyncManagerFactory(mainContext) {

  // map of user keys to client contexts
  const contexts = {};
  const settings = mainContext.get(mainContext.constants.SETTINGS);

  // call `createInstance` before creating PushManager, since it is in charge of creating the full producer and adding it into the main context.
  const syncManager = createInstance(false, mainContext);
  const pushManager = settings.streamingEnabled ? PushManagerFactory(mainContext, contexts) : undefined;
  const mainProducer = mainContext.get(mainContext.constants.PRODUCER);

  function startPolling() {
    if (!mainProducer.isRunning()) {
      log.info('Streaming not available. Starting periodic fetch of data.');
      forOwn(contexts, function (context) {
        const producer = context.get(context.constants.PRODUCER);
        producer.start();
      });
    } else {
      log.info('Streaming couldn\'t connect. Continue periodic fetch of data.');
    }
  }

  function stopPollingAndSyncAll() {
    if (mainProducer.isRunning()) {
      log.info('PUSH (re)connected. Syncing and stopping periodic fetch of data.');
      // if polling, stop
      forOwn(contexts, function (context) {
        const producer = context.get(context.constants.PRODUCER);
        producer.stop();
      });
    }
    syncAll();
  }

  function syncAll() {
    // fetch splits and segments
    const mainProducer = mainContext.get(mainContext.constants.PRODUCER);
    mainProducer.synchronizeSplits();
    forOwn(contexts, function (context) {
      const producer = context.get(context.constants.PRODUCER);
      producer.synchronizeMySegments();
    });
  }

  /**
   * Creates a SyncManager that handles the synchronization of clients (main and shared ones).
   * Internally, it creates the client producer, adds it into its context, and defines the `start` and `stop` methods that handle synchronization.
   *
   * @param {Object} context
   * @param {boolean} isSharedClient
   */
  function createInstance(isSharedClient, context) {
    const producer = isSharedClient ? PartialProducerFactory(context) : FullProducerFactory(context);
    const settings = context.get(context.constants.SETTINGS);
    // we need to stringify the user key (or matching key) in case it is not an string, to hash and pass as query param for authentication
    const userKey = toString(matching(settings.core.key));

    context.put(context.constants.PRODUCER, producer);
    if (contexts[userKey]) log.warn('A client with the same user key has already been created. Only the new instance will be properly synchronized.');
    contexts[userKey] = context;

    return {
      start() {
        // start syncing
        if (pushManager) {
          if (!isSharedClient) {
            syncAll(); // initial syncAll (only when main client is created)
            pushManager.on(PUSH_SUBSYSTEM_UP, stopPollingAndSyncAll);
            pushManager.on(PUSH_SUBSYSTEM_DOWN, startPolling);
          } else {
            if (mainProducer.isRunning()) {
              // if doing polling, we must start the producer periodic fetch of data
              producer.start();
            } else {
              // if not doing polling, we must perform a `producer.synchronizeMySegments` for the initial fetch
              // of segments since `syncAll` was already executed when starting the main client
              producer.synchronizeMySegments();
            }
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
            // We don't reconnect pushmanager when removing a shared client,
            // since it is more costly than continue listening the channel
          }

          if (producer.isRunning())
            producer.stop();

        }
      }
    };
  }

  // For the main client we return a SyncManager with 3 methods: start, stop and shared. The last is used to instantiate "partial SyncManagers".
  syncManager.shared = createInstance.bind(null, true);
  // pushManager is exposed to close SSE connection in browser on 'unload' DOM event.
  syncManager.pushManager = pushManager;

  return syncManager;
}