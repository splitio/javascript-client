import ManagerFactory from './manager';
import StorageFactory from './storage';
import ReadinessGateFacade from './readiness';
import SettingsFactory from './utils/settings';
import Context from './utils/context';
import keyParser from './utils/key/parser';
import logFactory, { API } from './utils/logger';
const log = logFactory('splitio');
import tracker from './utils/timeTracker';
import SplitFactoryOnline from './factory/online';
import SplitFactoryOffline from './factory/offline';
import { LOCALHOST_MODE } from './utils/constants';

export function SplitFactory(config) {
  // Cache instances created per factory.
  const instances = {};
  
  // Tracking times. We need to do it here because we need the storage created.
  const readyLatencyTrackers = {
    splitsReadyTracker: tracker.start(tracker.TaskNames.SPLITS_READY),
    segmentsReadyTracker: tracker.start(tracker.TaskNames.SEGMENTS_READY),
    sdkReadyTracker: tracker.start(tracker.TaskNames.SDK_READY)
  };
  const context = new Context();

  // Put settings config within context
  const settings = SettingsFactory(config);
  context.put(context.constants.SETTINGS, settings);

  // Put storage config within context
  const storage = StorageFactory(context);
  const gateFactory = ReadinessGateFacade();
  context.put(context.constants.STORAGE, storage);

  // Define which type of factory to use
  const splitFactory = settings.mode === LOCALHOST_MODE ? SplitFactoryOffline : SplitFactoryOnline;

  const {
    api: defaultInstance,
    metricCollectors: mainClientMetricCollectors
  } = splitFactory(context, gateFactory, readyLatencyTrackers);

  log.info('New Split SDK instance created.');

  return {
    // Split evaluation and event tracking engine
    client(key, trafficType) {
      if (!key) {
        log.debug('Retrieving default SDK client.');
        return defaultInstance;
      }

      if (typeof storage.shared != 'function') {
        throw 'Shared Client not supported by the storage mechanism. Create isolated instances instead.';
      }

      if (trafficType !== undefined && typeof trafficType !== 'string') {
        throw 'Traffic Type should be a string. Either use a valid Traffic Type or no Traffic Type at all.';
      }

      const parsedkey = keyParser(key);
      const instanceId = `${parsedkey.matchingKey}-${parsedkey.bucketingKey}-${trafficType !== undefined ? trafficType : ''}`;

      if (!instances[instanceId]) {
        const sharedSettings = settings.overrideKeyAndTT(key, trafficType);
        const sharedContext = new Context();
        sharedContext.put(context.constants.SETTINGS, sharedSettings);
        sharedContext.put(context.constants.STORAGE, storage.shared(sharedSettings));
        // As shared clients reuse all the storage information, we don't need to check here if we
        // will use offline or online mode. We should stick with the original decision.
        instances[instanceId] = splitFactory(sharedContext, gateFactory, false, mainClientMetricCollectors).api;
        // The readiness should depend on the readiness of the parent, instead of showing ready by default.
        instances[instanceId].ready = defaultInstance.ready;

        log.info('New shared client instance created.');
      } else {
        log.debug('Retrieving existing SDK client.');
      }

      return instances[instanceId];
    },

    // Manager API to explore available information
    manager() {
      log.info('New manager instance created.');
      return ManagerFactory(storage.splits);
    },

    // Logger wrapper API
    Logger: API,

    // Expose SDK settings
    settings
  };
}
