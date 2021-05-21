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
import sdkStatusManager from './readiness/statusManager';
import { LOCALHOST_MODE } from './utils/constants';
import { validateApiKey, validateKey, validateTrafficType } from './utils/inputValidation';
import IntegrationsManagerFactory from './integrations';
import ImpressionCounter from './impressions/counter';

const buildInstanceId = (key, trafficType) => `${key.matchingKey ? key.matchingKey : key}-${key.bucketingKey ? key.bucketingKey : key}-${trafficType !== undefined ? trafficType : ''}`;

export function SplitFactory(config) {
  // Cache instances created per factory.
  const clientInstances = {};

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

  // We will just log and allow for the SDK to end up throwing an SDK_TIMEOUT event for devs to handle.
  validateApiKey(settings.core.authorizationKey);

  // Put readiness and statusManager within context
  // Done before adding storage, to let it access readiness gate synchronously
  const gateFactory = ReadinessGateFacade();
  const readiness = gateFactory(settings.startup.readyTimeout);
  context.put(context.constants.READINESS, readiness);
  const statusManager = sdkStatusManager(context);
  context.put(context.constants.STATUS_MANAGER, statusManager);

  // Put storage config within context
  const storage = StorageFactory(context);
  context.put(context.constants.STORAGE, storage);

  // Put counter
  const impressionsCounter = new ImpressionCounter(); // Instantiates new counter for Impressions
  context.put(context.constants.IMPRESSIONS_COUNTER, impressionsCounter);

  // Put integrationsManager within context.
  // It needs to access the storage, settings and potentially other pieces, so it's registered after them.
  const integrationsManager = IntegrationsManagerFactory(context);
  context.put(context.constants.INTEGRATIONS_MANAGER, integrationsManager);

  // Define which type of factory to use
  const splitFactory = settings.mode === LOCALHOST_MODE ? SplitFactoryOffline : SplitFactoryOnline;

  const {
    api: mainClientInstance,
    metricCollectors: mainClientMetricCollectors
  } = splitFactory(context, readyLatencyTrackers);

  // It makes no sense to have multiple instances of the manager.
  const managerInstance = ManagerFactory(storage.splits, context);

  const parsedDefaultKey = keyParser(settings.core.key);
  const defaultInstanceId = buildInstanceId(parsedDefaultKey, settings.core.trafficType);
  clientInstances[defaultInstanceId] = mainClientInstance;

  log.info('New Split SDK instance created.');

  return {
    // Split evaluation and event tracking engine
    client(key, trafficType) {
      if (key === undefined) {
        log.debug('Retrieving default SDK client.');
        return mainClientInstance;
      }

      if (typeof storage.shared != 'function') {
        throw new Error('Shared Client not supported by the storage mechanism. Create isolated instances instead.');
      }

      // Validate the key value
      const validKey = validateKey(key, 'Shared Client instantiation');
      if (validKey === false) {
        throw new Error('Shared Client needs a valid key.');
      }

      let validTrafficType;
      if (trafficType !== undefined) {
        validTrafficType = validateTrafficType(trafficType, 'Shared Client instantiation');
        if (validTrafficType === false) {
          throw new Error('Shared Client needs a valid traffic type or no traffic type at all.');
        }
      }
      const instanceId = buildInstanceId(validKey, validTrafficType);

      if (!clientInstances[instanceId]) {
        const sharedSettings = settings.overrideKeyAndTT(validKey, validTrafficType);
        const sharedContext = new Context();

        const readiness = gateFactory(sharedSettings.startup.readyTimeout);
        sharedContext.put(context.constants.READY_FROM_CACHE, context.get(context.constants.READY_FROM_CACHE, true));
        sharedContext.put(context.constants.READINESS, readiness);
        // for shared clients, the internal offset of added/removed SDK_READY callbacks is -1
        sharedContext.put(context.constants.STATUS_MANAGER, sdkStatusManager(sharedContext, -1));
        sharedContext.put(context.constants.SETTINGS, sharedSettings);
        sharedContext.put(context.constants.STORAGE, storage.shared(sharedSettings));
        sharedContext.put(context.constants.IMPRESSIONS_COUNTER, impressionsCounter);
        // As shared clients reuse all the storage information, we don't need to check here if we
        // will use offline or online mode. We should stick with the original decision.
        clientInstances[instanceId] = splitFactory(sharedContext, false, mainClientMetricCollectors).api;

        log.info('New shared client instance created.');
      } else {
        log.debug('Retrieving existing SDK client.');
      }

      return clientInstances[instanceId];
    },

    // Manager API to explore available information
    manager() {
      log.info('Manager instance retrieved.');
      return managerInstance;
    },

    // Logger wrapper API
    Logger: API,

    // Expose SDK settings
    settings
  };
}
