import ClientFactory from '../client';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import MetricsFactory from '../metrics';
import EventsFactory from '../events';
import SignalsListener from '../listeners';
import { STANDALONE_MODE, PRODUCER_MODE, CONSUMER_MODE } from '../utils/constants';

//
// Create SDK instance based on the provided configurations
//
function SplitFactoryOnline(context, readyTrackers, mainClientMetricCollectors) {
  const sharedInstance = !!mainClientMetricCollectors;
  const settings = context.get(context.constants.SETTINGS);
  const readiness = context.get(context.constants.READINESS);
  const storage = context.get(context.constants.STORAGE);
  const statusManager = context.get(context.constants.STATUS_MANAGER);

  // We are only interested in exposable EventEmitter
  const { gate, splits, segments } = readiness;

  // Events name
  const { SDK_READY } = gate;

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
      setTimeout(() => { // Allow for the sync statements to run so client is returned before these are emitted.
        splits.emit(splits.SDK_SPLITS_ARRIVED, false);
        segments.emit(segments.SDK_SEGMENTS_ARRIVED, false);
      }, 0);
      break;
  }

  if (readyTrackers && producer && !sharedInstance) { // Only track ready events for non-shared and non-consumer clients
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

  // If no collectors are stored we are on a shared instance, save main one.
  context.put(context.constants.COLLECTORS, mainClientMetricCollectors);

  const api = Object.assign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(statusManager),
    // getTreatment/s & track
    ClientFactory(context),
    // Utilities
    {
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
