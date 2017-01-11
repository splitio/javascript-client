// @flow

'use strict';

const ClientFactory = require('./client');
const ManagerFactory = require('./manager');
const StorageFactory = require('./storage');
const ProducerFactory = require('./producer');
const MetricsFactory = require('./metrics');

const SettingsFactory = require('./utils/settings');

const ReadinessGate = require('./readiness');
const ReadinessGateFactory = ReadinessGate();

function SplitFactory(config: Object) {
  const settings = SettingsFactory(config);
  const readiness = ReadinessGateFactory(settings.startup.readyTimeout);
  const storage = StorageFactory(settings.storage);
  const producer = ProducerFactory(settings, readiness, storage);
  const metrics = MetricsFactory(settings, storage);

  // Start background jobs tasks
  producer.start();
  metrics.start();

  const sdk = Object.assign(ClientFactory(settings, storage), {
    // Expose SDK Events
    events() {
      return readiness.gate;
    },

    // Destroy the SDK instance
    destroy() {
      readiness.destroy();
      producer && producer.stop();
      metrics && metrics.stop();
    }
  });

  return {
    // Split evaluation engine
    client(): SplitClient {
      return sdk;
    },

    // Manager API to explore available information
    manager(): SplitManager {
      return ManagerFactory(storage.splits);
    },

    // Expose SDK settings
    settings,

    // Expose SDK Events names
    Events: readiness.Events
  };
};

module.exports = SplitFactory;
