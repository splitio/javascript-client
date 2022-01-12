import objectAssign from 'object-assign';
import ClientFactory from '../client';
import MetricsFactory from '../metrics';
import EventsFactory from '../events';
import SyncManagerFactory from '../sync';
import SignalsListener from '../listeners';
import { releaseApiKey } from '../utils/inputValidation';
import { STANDALONE_MODE, PRODUCER_MODE, CONSUMER_MODE } from '../utils/constants';

// map of authorizationKeys to syncManagers, to keep a single instance per factory and needed to create shared clients
const syncManagers = {};

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

  let syncManager;

  switch (settings.mode) {
    case PRODUCER_MODE:
    case STANDALONE_MODE: {
      context.put(context.constants.COLLECTORS, metrics && metrics.collectors);
      // We don't fully instantiate syncManager if we are creating a shared instance.
      if (sharedInstance) {
        syncManager = syncManagers[settings.core.authorizationKey].shared(context);
      } else {
        syncManager = SyncManagerFactory(context);
        syncManagers[settings.core.authorizationKey] = syncManager;
      }
      break;
    }
    case CONSUMER_MODE: {
      context.put(context.constants.READY_FROM_CACHE, true); // For SDK inner workings it's supposed to be ready from cache.
      break;
    }
  }

  // Signal listener only needed for main instances
  const signalsListener = sharedInstance ? undefined : new SignalsListener(context, syncManager);

  if (readyTrackers && syncManager && !sharedInstance) { // Only track ready events for non-shared and non-consumer clients
    const {
      sdkReadyTracker, splitsReadyTracker, segmentsReadyTracker
    } = readyTrackers;

    // Defered setup of collectors for this task, as it is the only ready latency we store on BE.
    sdkReadyTracker.setCollectorForTask(metrics.collectors);

    gate.once(SDK_READY, sdkReadyTracker);
    splits.once(splits.SDK_SPLITS_ARRIVED, splitsReadyTracker);
    segments.once(segments.SDK_SEGMENTS_ARRIVED, segmentsReadyTracker);
  }

  // Start background jobs tasks
  syncManager && syncManager.start();
  metrics && metrics.start();
  events && context.put(context.constants.EVENTS, events) && events.start();

  // If no collectors are stored we are on a shared instance, save main one.
  context.put(context.constants.COLLECTORS, mainClientMetricCollectors);

  const api = objectAssign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(statusManager),
    // getTreatment/s & track
    ClientFactory(context),
    // Utilities
    {
      // Destroy instance
      destroy() {
        // Stop background jobs
        syncManager && syncManager.stop();
        metrics && metrics.stop();
        events && events.stop();

        // Send impressions and events in parallel.
        return Promise.all([
          metrics && metrics.flush(),
          events && events.flush()
        ]).then(function () {

          // Cleanup event listeners
          readiness.destroy();
          signalsListener && signalsListener.stop();

          // Cleanup storage
          storage.destroy && storage.destroy();
          // Mark the factory as destroyed.
          context.put(context.constants.DESTROYED, true);
          // And release the API Key and SyncManager
          if (!sharedInstance) {
            releaseApiKey(settings.core.authorizationKey);
            delete syncManagers[settings.core.authorizationKey];
          }
        });
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
