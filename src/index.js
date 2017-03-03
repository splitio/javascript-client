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

const ReadinessGate = require('./readiness');
const ReadinessGateFactory = ReadinessGate();

const keyParser = require('./utils/key/parser');

// cache instances created
const instances = {};

//
// Create SDK instance based on the provided configurations
//
function SplitFactory(settings: Settings, storage: SplitStorage) {
  const readiness = ReadinessGateFactory(settings.startup.readyTimeout);

  // We are only interested in exposable EventEmitter
  const { gate } = readiness;

  // Events name
  const {
    SDK_READY,
    SDK_UPDATE,
    SDK_READY_TIMED_OUT
  } = gate;

  let producer;
  let metrics;
  let offline;

  switch(settings.mode) {
    case 'localhost':
      offline = OfflineProducerFactory(settings, readiness, storage);

      // Start background jobs tasks
      offline.start();
      break;
    case 'producer':
    case 'standalone': {
      producer = FullProducerFactory(settings, readiness, storage);
      metrics = MetricsFactory(settings, storage);

      // Start background jobs tasks
      producer.start();
      metrics.start();
      break;
    }
    case 'consumer':
      break;
  }

  // Ready promise
  const ready = new Promise(resolve => gate.on(SDK_READY, resolve));

  const api = Object.assign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(gate),
    // GetTreatment
    ClientFactory(settings, storage),
    // Utilities
    {
      // Ready promise
      ready,

      // Events contants
      Event: {
        SDK_READY,
        SDK_UPDATE,
        SDK_READY_TIMED_OUT
      },

      // Destroy instance
      destroy() {
        readiness.destroy();

        producer && producer.stop();
        metrics && metrics.stop();
        offline && offline.stop();
      }
    }
  );

  return api;
}

//
// Create partial SDK instance reusing as much as we can (ONLY BROWSER).
//
function SharedSplitFactory(settings: Settings, storage: SplitStorage) {
  const readiness = ReadinessGateFactory(settings.startup.readyTimeout);

  // We are only interested in exposable EventEmitter
  const { gate } = readiness;

  // Events name
  const {
    SDK_READY,
    SDK_UPDATE,
    SDK_READY_TIMED_OUT
  } = gate;

  const producer = PartialProducerFactory(settings, readiness, storage);

  // Ready promise
  const ready = new Promise(resolve => gate.on(SDK_READY, resolve));

  // In shared instanciation (only available for the browser), we start producer
  // module by default
  producer.start();

  const api = Object.assign(
    // Proto linkage of the EventEmitter to prevent any change
    Object.create(gate),
    // GetTreatment
    ClientFactory(settings, storage),
    // Utilities
    {
      // Ready promise
      ready,

      // Events contants
      Event: {
        SDK_READY,
        SDK_UPDATE,
        SDK_READY_TIMED_OUT
      },

      // Destroy instance
      destroy() {
        readiness.destroy();
        producer.stop();
      }
    }
  );

  return api;
}

function SplitFacade(config: Object) {
  const settings = SettingsFactory(config);
  const storage = StorageFactory(settings);

  const defaultInstance = SplitFactory(settings, storage);

  return {

    // Split evaluation engine
    client(key: ?SplitKey): SplitClient {
      if (!key) return defaultInstance;

      if (typeof storage.shared != 'function') {
        throw 'Shared Client not supported by the storage mechanism. Create isolated instances instead.';
      }

      const parsedkey = keyParser(key);
      const instanceId = `${parsedkey.matchingKey}-${parsedkey.bucketingKey}`;

      if (!instances[instanceId]) {
        const sharedSettings = settings.overrideKey(key);
        instances[instanceId] = SharedSplitFactory(sharedSettings, storage.shared(sharedSettings));
      }

      return instances[instanceId];
    },

    // Manager API to explore available information
    manager(): SplitManager {
      return ManagerFactory(storage.splits);
    },

    // Expose SDK settings
    settings
  };
}

module.exports = SplitFacade;
