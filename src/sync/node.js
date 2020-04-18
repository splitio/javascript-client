import PushManagerFactory from './PushManager';
import { PUSH_DISCONNECT, PUSH_CONNECT } from './constants';
import FullProducerFactory from '../producer';
import logFactory from '../utils/logger';
const log = logFactory('splitio-sync:sync-manager');

/**
 * Factory of SyncManager for node
 *
 * @param context main client context
 */
export default function NodeSyncManagerFactory(context) {

  const producer = FullProducerFactory(context);
  context.put(context.constants.PRODUCER, producer);

  function startPolling() {
    log.info('PUSH down or disconnected. Starting periodic fetch of data.');
    if (!producer.isRunning())
      producer.start(true); // `fetchers` are scheduled but not called immediately
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

  let pushManager;

  const settings = context.get(context.constants.SETTINGS);
  if (settings.streamingEnabled)
    pushManager = PushManagerFactory(context);

  return {
    start() {
      // start syncing
      if (pushManager) {
        syncAll();
        pushManager.on(PUSH_CONNECT, stopPollingAndSyncAll);
        pushManager.on(PUSH_DISCONNECT, startPolling);
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