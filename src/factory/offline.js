const ClientFactory = require('../client');
const OfflineProducerFactory = require('../producer/offline');

//
// Create SDK instance for offline mode.
//
function SplitFactoryOffline(context, gateFactory, sharedTrackers) {
  const sharedInstance = !sharedTrackers;
  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);
  const readiness = gateFactory(settings.startup.readyTimeout);

  context.put(context.constants.READINESS, readiness);

  // We are only interested in exposable EventEmitter
  const { gate } = readiness;

  // Events name
  const {
    SDK_READY,
    SDK_UPDATE,
    SDK_READY_TIMED_OUT
  } = gate;

  const producer = sharedInstance ? undefined : OfflineProducerFactory(context);

  // Start background jobs tasks
  producer && producer.start();

  // Ready promise
  const readyFlag = sharedInstance ? Promise.resolve() :
    new Promise(resolve => {
      gate.on(SDK_READY, resolve);
      // No time out because we use fs.readFileSync. If we revisit that when refactoring
      // and use an asynchronous method, we may want to reject on timeout event.
    });

  const api = Object.assign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(gate),
    // GetTreatment/s
    ClientFactory(context),
    // Utilities
    {
      // Ready promise
      ready() {
        return readyFlag;
      },

      // Events contants
      Event: {
        SDK_READY,
        SDK_UPDATE,
        SDK_READY_TIMED_OUT
      },

      // Destroy instance. Async so we respect the online api.
      async destroy() {
        // Stop background jobs
        producer && producer.stop();
        // Cleanup event listeners
        readiness.destroy();
        // Cleanup storage
        storage.destroy && storage.destroy();
      }
    }
  );

  return {
    api,
    metricCollectors: false // We won't collect any metrics on localhost mode.
  };
}

module.exports = SplitFactoryOffline;
