// @flow

'use strict';

const ClientFactory = require('./client');
const ManagerFactory = require('./manager');
const StorageFactory = require('./storage');

const FullProducerFactory = require('./producer');
const PartialProducerFactory = require('./producer/browser/Partial');

const MetricsFactory = require('./metrics');

const SettingsFactory = require('./utils/settings');

const ReadinessGate = require('./readiness');
const ReadinessGateFactory = ReadinessGate();

const instances = {};

function SplitFactory(config: Object) {
  const settings = SettingsFactory(config);
  const readiness = ReadinessGateFactory(settings.startup.readyTimeout);
  const storage = StorageFactory(settings.storage);

  let producer;
  let metrics;

  switch(settings.mode) {
    case 'localhost':
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
  }

  instances.default = Object.assign(ClientFactory(settings, storage), {
    // Expose SDK Events
    events() {
      return readiness.gate;
    },

    // Destroy the SDK instance
    destroy() {
      readiness.destroy();
      producer && producer.stop();
      metrics && metrics.stop();
      delete instances.default;
    }
  });

  return {
    // Split evaluation engine
    client(): SplitClient {
      return instances.default;
    },

    // Shared evaluation engine (browser only)
    sharedClient(key: string): SplitClient {
      if (key === settings.core.key) key = 'default';

      if (!instances[key]) {
        const sharedSettings = settings.overrideKey(key);
        const sharedStorage = storage.shared();
        const sharedReadinessGate = ReadinessGateFactory(sharedSettings.startup.readyTimeout);
        const sharedProducer = PartialProducerFactory(sharedSettings, sharedReadinessGate, sharedStorage);

        sharedProducer.start();

        instances[key] = Object.assign(ClientFactory(sharedSettings, sharedStorage), {
          // Expose SDK Events
          events() {
            return sharedReadinessGate.gate;
          },

          // Destroy the SDK instance
          destroy() {
            sharedReadinessGate.destroy();
            sharedProducer.stop();
            delete instances[key];
          }
        });
      }

      return instances[key];
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
