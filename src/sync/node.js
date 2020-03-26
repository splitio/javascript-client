import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import { SETTINGS } from '../utils/context/constants';

// Not do initial syncAll in producers
/**
 * Factory of SyncManager for node
 *
 * @param context main client context
 */
export default function NodeSyncManagerFactory() {

  let pushManager;
  let producer;

  function startPolling() {
    if (producer && !producer.isRunning())
      producer.start();
  }

  function stopPollingAndSyncAll() {
    // if polling, stop
    if (producer && producer.isRunning())
      producer.stop();
    syncAll();
  }

  function syncAll() {
    // fetch splits and segments. There is no need to catch this promise (it is handled by `SplitChangesUpdater`)
    producer && producer.callSplitsUpdater().then(() => {
      producer.callSegmentsUpdater();
    });
  }

  return {
    startSync(context) {
      const settings = context.get(SETTINGS);
      producer = FullProducerFactory(context);

      if (settings.streamingEnabled)
        pushManager = PushManagerFactory({
          onPushConnect: stopPollingAndSyncAll,
          onPushDisconnect: startPolling,
        }, context, producer);

      // start syncing
      if (pushManager) {
        syncAll();
        pushManager.connectPush();
      } else {
        producer.start();
      }
    },
    stopSync() {
      // stop syncing
      if (pushManager)
        pushManager.stopPush();

      if (producer.isRunning())
        producer.stop();
    },
  };
}