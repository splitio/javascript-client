import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import logFactory from '../utils/logger';
import { PUSH_SUBSYSTEM_DOWN, PUSH_SUBSYSTEM_UP } from './constants';
const log = logFactory('splitio-sync:sync-manager');

/**
 * Factory of SyncManager for node
 *
 * @param context main client context
 */
export default function NodeSyncManagerFactory(context) {

  const producer = FullProducerFactory(context);
  const settings = context.get(context.constants.SETTINGS);

  // add producer into the context before creating the PushManager
  context.put(context.constants.PRODUCER, producer);
  const pushManager = settings.streamingEnabled ? PushManagerFactory(context) : undefined;

  function startPolling() {
    if (!producer.isRunning()) {
      log.info('Streaming not available. Starting periodic fetch of data.');
      producer.start();
    } else {
      log.info('Streaming couldn\'t connect. Continue periodic fetch of data.');
    }
  }

  function stopPollingAndSyncAll() {
    log.info('PUSH (re)connected. Syncing and stopping periodic fetch of data.');
    // if polling, stop
    if (producer.isRunning())
      producer.stop();
    syncAll();
  }

  function syncAll() {
    // fetch splits and segments. There is no need to catch this promise (it is handled by `SplitChangesUpdater`)
    producer.synchronizeSplits().then(() => {
      producer.synchronizeSegment();
    });
  }

  return {
    start() {
      // start syncing
      if (pushManager) {
        syncAll();
        pushManager.on(PUSH_SUBSYSTEM_UP, stopPollingAndSyncAll);
        pushManager.on(PUSH_SUBSYSTEM_DOWN, startPolling);
        setTimeout(pushManager.start); // Run in next event-loop cycle as in browser
      } else {
        producer.start();
      }
    },
    stop() {
      // stop syncing
      if (pushManager)
        pushManager.stop();

      if (producer.isRunning())
        producer.stop();
    }
  };
}