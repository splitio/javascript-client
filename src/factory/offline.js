import objectAssign from 'object-assign';
import ClientFactory from '../client';
import OfflineProducerFactory from '../producer/offline';
import { releaseApiKey } from '../utils/inputValidation';

//
// Create SDK instance for offline mode.
//
function SplitFactoryOffline(context, sharedTrackers) {
  const sharedInstance = !sharedTrackers;
  const readiness = context.get(context.constants.READINESS);
  const storage = context.get(context.constants.STORAGE);
  const statusManager = context.get(context.constants.STATUS_MANAGER);

  // In LOCALHOST mode, shared clients are ready in the next event-loop cycle than created
  // and then updated on each SDK_SPLITS_ARRIVED event
  if (sharedInstance) setTimeout(() => {
    readiness.splits.on(readiness.splits.SDK_SPLITS_ARRIVED, () => {
      readiness.gate.emit(readiness.gate.SDK_UPDATE);
    });
    readiness.gate.emit(readiness.gate.SDK_READY);
  }, 0);

  // Producer
  const producer = sharedInstance ? undefined : OfflineProducerFactory(context);

  // Start background task for flag updates
  producer && producer.start();

  const api = objectAssign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(statusManager),
    // GetTreatment/s
    ClientFactory(context),
    // Utilities
    {
      // Destroy instance. Async so we respect the online api.
      destroy() {
        // Stop background jobs
        producer && producer.stop();
        // Cleanup event listeners
        readiness.destroy();
        // Cleanup storage
        storage.destroy && storage.destroy();
        // Mark the factory as destroyed.
        context.put(context.constants.DESTROYED, true);
        !sharedInstance && releaseApiKey();

        return Promise.resolve();
      }
    }
  );

  return {
    api,
    metricCollectors: false // We won't collect any metrics on localhost mode.
  };
}

export default SplitFactoryOffline;
