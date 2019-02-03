import ClientFactory from '../client';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import MetricsFactory from '../metrics';
import EventsFactory from '../events';
import SignalsListener from '../listeners';
import { STANDALONE_MODE, PRODUCER_MODE, CONSUMER_MODE } from '../utils/constants';
import logFactory from '../utils/logger';
const log = logFactory('splitio-factory');

//
// Create SDK instance based on the provided configurations
//
function SplitFactoryOnline(context, gateFactory, readyTrackers, mainClientMetricCollectors) {
  const sharedInstance = !!mainClientMetricCollectors;
  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);

  // Put readiness config within context
  const readiness = gateFactory(settings.startup.readyTimeout);
  context.put(context.constants.READINESS, readiness);

  // We are only interested in exposable EventEmitter
  const { gate, splits, segments } = readiness;

  // Events name
  const {
    SDK_READY,
    SDK_UPDATE,
    SDK_READY_TIMED_OUT
  } = gate;

  // Shared instances use parent metrics collectors
  const metrics = sharedInstance ? undefined : MetricsFactory(context);
  // Shared instances use parent events queue
  const events = sharedInstance ? undefined : EventsFactory(context);
  // Signal listener only needed for main instances
  const signalsListener = sharedInstance ? undefined : new SignalsListener(context);

  let producer;

  switch(settings.mode) {
    case PRODUCER_MODE:
    case STANDALONE_MODE: {
      context.put(context.constants.COLLECTORS, metrics && metrics.collectors);
      // We don't fully instantiate producer if we are creating a shared instance.
      producer = sharedInstance ?
        PartialProducerFactory(context) :
        FullProducerFactory(context);
      break;
    }
    case CONSUMER_MODE:
      break;
  }

  if (readyTrackers && !sharedInstance) { // Only track ready events for non-shared clients
    const {
      sdkReadyTracker, splitsReadyTracker, segmentsReadyTracker
    } = readyTrackers;

    // Defered setup of collectors for this task, as it is the only ready latency we store on BE.
    sdkReadyTracker.setCollectorForTask(metrics.collectors);

    gate.on(SDK_READY, sdkReadyTracker);
    splits.on(splits.SDK_SPLITS_ARRIVED, splitsReadyTracker);
    segments.on(segments.SDK_SEGMENTS_ARRIVED, segmentsReadyTracker);
  }

  // Start background jobs tasks
  producer && producer.start();
  metrics && metrics.start();
  events && context.put(context.constants.EVENTS, events) && events.start();

  function generateReadyPromise() {
    let hasCatch = false;
    const promise = new Promise((resolve, reject) => {
      gate.on(SDK_READY, resolve);
      gate.on(SDK_READY_TIMED_OUT, reject);
    }).catch(function(err) {
      // If the promise has a custom error handler, just propagate
      if (hasCatch) throw err;
      // If not handle the error to prevent unhandled promise exception.
      log.error(err);
    });
    const originalThen = promise.then;

    // Using .catch(fn) is the same than using .then(null, fn)
    promise.then = function () {
      if (arguments.length > 1 && typeof arguments[1] === 'function')
        hasCatch = true;
      return originalThen.apply(this, arguments);
    };

    return promise;
  }

  // Ready promise
  const readyFlag = sharedInstance ? Promise.resolve() : generateReadyPromise();

  // If no collectors are stored we are on a shared instance, save main one.
  context.put(context.constants.COLLECTORS, mainClientMetricCollectors);

  const api = Object.assign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(gate),
    // getTreatment/s & track
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

      // Destroy instance
      async destroy() {
        // Stop background jobs
        producer && producer.stop();
        metrics && metrics.stop();
        events && events.stop();

        // Send impressions and events in parallel.
        await Promise.all([
          metrics && metrics.flush(),
          events && events.flush()
        ]);

        // Cleanup event listeners
        readiness.destroy();
        signalsListener && signalsListener.stop();

        // Cleanup storage
        storage.destroy && storage.destroy();
        // Mark the factory as destroyed.
        context.put(context.constants.DESTROYED, true);
      }
    }
  );

  // We'll start the signals listener if the client is not a shared instance.
  // For now, we will only call destroy.
  !sharedInstance && signalsListener.start(api.destroy);

  return {
    api,
    metricCollectors: metrics && metrics.collectors
  };
}

export default SplitFactoryOnline;
