import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import { SETTINGS } from '../utils/context/constants';

/**
 * Factory of SyncManager
 *
 * @param context main client context
 */
export default function NodeSyncManagerFactory() {

  let pushManager = undefined;
  let producer = undefined;

  function startPolling() {
    if (!producer.isRunning())
      producer.start();
  }

  // for the moment, the PushManager uses `stopPolling` together with `syncAll`, but they are separated for future scenarios
  function stopPolling() {
    // if polling, stop
    if (producer.isRunning())
      producer.stop();
  }

  function syncAll() {
    // fetch splits and segments. There is no need to catch this promise (it is handled by `SplitChangesUpdater`)
    producer.callSplitsUpdater().then(() => {
      producer.callSegmentsUpdater();
    });
  }

  return {
    startSync(context) {
      const settings = context.get(SETTINGS);
      producer = FullProducerFactory(context);

      if (settings.streamingEnabled)
        pushManager = PushManagerFactory({
          startPolling,
          stopPolling,
          syncAll,
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