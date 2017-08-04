// @flow

'use strict';

const ClientFactory = require('./client');
const ManagerFactory = require('./manager');
const StorageFactory = require('./storage');

const FullProducerFactory = require('./producer');
const PartialProducerFactory = require('./producer/browser/Partial');

const OfflineProducerFactory = require('./producer/offline');

const MetricsFactory = require('./metrics');

const SettingsFactory = require('./utils/settings');

const ReadinessGateFacade = require('./readiness');

const keyParser = require('./utils/key/parser');
const Logger = require('./utils/logger');
const log = Logger('splitio');
const tracker = require('./utils/timeTracker');

// cache instances created
const instances = {};

//
// Create SDK instance based on the provided configurations
//
function SplitFactory(settings: Settings, storage: SplitStorage, gateFactory: any, readyTrackers: Object, sharedInstance: ?boolean) {
  const readiness = gateFactory(settings.startup.readyTimeout);

  // We are only interested in exposable EventEmitter
  const { gate, splits, segments } = readiness;

  // Events name
  const {
    SDK_READY,
    SDK_UPDATE,
    SDK_READY_TIMED_OUT
  } = gate;

  let producer;
  let metrics;

  switch(settings.mode) {
    case 'localhost':
      producer = sharedInstance ? undefined : OfflineProducerFactory(settings, readiness, storage);
      break;
    case 'producer':
    case 'standalone': {
      // We don't fully instantiate metrics and producer if we are creating a shared instance.
      metrics = sharedInstance ? undefined : MetricsFactory(settings, storage);
      producer = sharedInstance ?
        PartialProducerFactory(settings, readiness, storage, metrics && metrics.collectors) :
        FullProducerFactory(settings, readiness, storage, metrics && metrics.collectors);
      break;
    }
    case 'consumer':
      break;
  }
  // If we have received the readyTrackers (shared instances don't use them) and we have metrics for this instance storage
  if (readyTrackers && metrics) {
    const {
       sdkReadyTracker, splitsReadyTracker, segmentsReadyTracker
    } = readyTrackers;

    // As we start tracking the time as soon as the Facade is called, and in that moment we don't have the metrics instantiated,
    // we need to give the "collectors" to the tracking tools so it can setup the specific collector for this task.
    sdkReadyTracker.setCollectorForTask(metrics.collectors);
    // We register to readiness gate events.
    gate.on(SDK_READY, sdkReadyTracker);
    splits.on(splits.SDK_SPLITS_ARRIVED, splitsReadyTracker);
    segments.on(segments.SDK_SEGMENTS_ARRIVED, segmentsReadyTracker);
  }

  // Start background jobs tasks
  producer && producer.start();
  metrics && metrics.start();

  // Ready promise
  const readyFlag = sharedInstance ? Promise.resolve() :
    new Promise(resolve => gate.on(SDK_READY, resolve));

  const api = Object.assign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(gate),
    // GetTreatment/s
    ClientFactory(storage, metrics && metrics.collectors, settings),
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

        // Send impressions if required
        await metrics && metrics.flush();

        // Cleanup event listeners
        readiness.destroy();

        // Cleanup storage
        storage.destroy && storage.destroy();
      }
    }
  );

  return api;
}

function SplitFacade(config: Object) {
  // Tracking times. We need to do it here because we need the storage created.
  const readyLatencyTrackers = {
    splitsReadyTracker: tracker.start(tracker.TaskNames.SPLITS_READY),
    segmentsReadyTracker: tracker.start(tracker.TaskNames.SEGMENTS_READY),
    sdkReadyTracker: tracker.start(tracker.TaskNames.SDK_READY)
  };
  const settings = SettingsFactory(config);
  const storage = StorageFactory(settings);
  const gateFactory = ReadinessGateFacade();

  const defaultInstance = SplitFactory(settings, storage, gateFactory, readyLatencyTrackers);

  log.info('New Split SDK instance created.');

  return {

    // Split evaluation engine
    client(key: ?SplitKey): SplitClient {
      if (!key) {
        log.debug('Retrieving default SDK client.');
        return defaultInstance;
      }

      if (typeof storage.shared != 'function') {
        throw 'Shared Client not supported by the storage mechanism. Create isolated instances instead.';
      }

      const parsedkey = keyParser(key);
      const instanceId = `${parsedkey.matchingKey}-${parsedkey.bucketingKey}`;

      if (!instances[instanceId]) {
        const sharedSettings = settings.overrideKey(key);
        instances[instanceId] = SplitFactory(sharedSettings, storage.shared(sharedSettings), gateFactory, false, true);
        log.info('New shared client instance created.');
      } else {
        log.debug('Retrieving existing SDK client.');
      }

      return instances[instanceId];
    },

    // Manager API to explore available information
    manager(): SplitManager {
      log.info('New manager instance created.');
      return ManagerFactory(storage.splits);
    },

    // Logger wrapper API
    Logger: Logger.API,

    // Expose SDK settings
    settings
  };
}

module.exports = SplitFacade;
