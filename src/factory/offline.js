import ClientFactory from '../client';
import OfflineProducerFactory from '../producer/offline';

//
// Create SDK instance for offline mode.
//
function SplitFactoryOffline(context, sharedTrackers) {
  const sharedInstance = !sharedTrackers;
  const readiness = context.get(context.constants.READINESS);
  const storage = context.get(context.constants.STORAGE);
  const statusManager = context.get(context.constants.STATUS_MANAGER);

  // Producer
  const producer = sharedInstance ? undefined : OfflineProducerFactory(context);

  // Start background task for flag updates
  producer && producer.start();

  const api = Object.assign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(statusManager),
    // GetTreatment/s
    ClientFactory(context),
    // Utilities
    {
      // Destroy instance. Async so we respect the online api.
      async destroy() {
        // Stop background jobs
        producer && producer.stop();
        // Cleanup event listeners
        readiness.destroy();
        // Cleanup storage
        storage.destroy && storage.destroy();
        // Mark the factory as destroyed.
        context.put(context.constants.DESTROYED, true);
      }
    }
  );

  return {
    api,
    metricCollectors: false // We won't collect any metrics on localhost mode.
  };
}

export default SplitFactoryOffline;
