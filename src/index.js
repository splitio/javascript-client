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

const instances = {};
let sequenceId = 1;

function SplitFactory(config: Object) {
  const settings = SettingsFactory(config);
  const readiness = ReadinessGateFactory(settings.startup.readyTimeout);
  const storage = StorageFactory(settings);

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

  let ready = new Promise(
    resolve => readiness.gate.on(readiness.gate.SDK_READY, resolve)
  );

  let defaultInstance = Object.assign(ClientFactory(settings, storage), {
    // Instace ID
    id: sequenceId++,

    // Ready promise
    ready,

    // Expose SDK Events
    events() {
      return readiness.gate;
    },

    // Destroy the SDK instance
    destroy() {
      readiness.destroy();

      producer && producer.stop();
      metrics && metrics.stop();
      offline && offline.stop();
    }
  });

  return {
    // Split evaluation engine
    client(): SplitClient {
      return defaultInstance;
    },

    // Shared evaluation engine (browser only)
    sharedClient(key: SplitKey): SplitClient {
      if (typeof storage.shared != 'function') {
        throw 'Shared Client not supported by the storage mechanism. Create isolated instances instead.';
      }

      const parsedkey = keyParser(key);
      const instanceId = `${parsedkey.matchingKey}-${parsedkey.bucketingKey}`;

      if (!instances[instanceId]) {
        const sharedSettings = settings.overrideKey(key);
        const sharedStorage = storage.shared(sharedSettings);
        const sharedReadinessGate = ReadinessGateFactory(sharedSettings.startup.readyTimeout);
        const sharedProducer = PartialProducerFactory(sharedSettings, sharedReadinessGate, sharedStorage);

        const ready = new Promise(
          resolve => sharedReadinessGate.gate.on(sharedReadinessGate.gate.SDK_READY, resolve)
        );

        sharedProducer.start();

        instances[instanceId] = Object.assign(ClientFactory(sharedSettings, sharedStorage), {
          // Instace ID
          id: sequenceId++,

          // Ready promise
          ready,

          // Expose SDK Events
          events() {
            return sharedReadinessGate.gate;
          },

          // Destroy the SDK instance
          destroy() {
            sharedReadinessGate.destroy();
            sharedProducer.stop();
            delete instances[instanceId];
          }
        });
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

module.exports = SplitFactory;
