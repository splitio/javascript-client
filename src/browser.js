// @flow

'use strict';

const ClientFactory = require('./client');
const ManagerFactory = require('./manager');

const StorageFactory = require('./storage');

const FullFetcherFactory = require('./producer/browser/Full');
const PartialFetcherFactory = require('./producer/browser/Partial');

const MetricsFactory = require('./metrics');

const SettingsFactory = require('./utils/settings');

const ReadinessGate = require('./readiness');
const ReadinessGateFactory = ReadinessGate();

function contextify(settings, storage, readiness: ReadinessGate, fetcher, metrics) {
  return Object.assign(ClientFactory(settings, storage), {
    // Expose SDK Events
    events() {
      return readiness.gate;
    },
    /**
     * Destroy the SDK instance.
     */
    destroy() {
      readiness.destroy();
      fetcher && fetcher.stop();
      metrics && metrics.stop();
    }
  });
};

SplitFactory.clients = {};
function SplitFactory(config: Object) {
  const settings = SettingsFactory(config);
  const readiness = ReadinessGateFactory(settings.startup.readyTimeout);
  const storage = StorageFactory(settings.storage);

  const fetcher = FullFetcherFactory(settings, readiness, storage);
  const metrics = MetricsFactory(settings, storage);

  // Start producers (will change soon)
  fetcher.start();
  metrics.start();

  SplitFactory.clients[config.core.key] = contextify(
    settings,
    storage,
    readiness,
    fetcher,
    metrics
  );

  return {
    client(key: ?string): SplitClient {
      if (!key) key = settings.core.key;

      if (!SplitFactory.clients[key]) {
        const partialSettings = settings.overrideKey(key);
        const partialStorage = storage.createSharingEverythingButSegments();
        const partialEvents = ReadinessGateFactory(settings.startup.readyTimeout);
        const partialFetcher = PartialFetcherFactory(partialSettings, partialEvents, partialStorage);

        // Start producers (will change soon)
        partialFetcher.start();

        SplitFactory.clients[key] = contextify(
          partialSettings,
          partialStorage,
          partialEvents,
          partialFetcher
        )
      }

      return SplitFactory.clients[key];
    },

    manager(): SplitManager {
      return ManagerFactory(storage.splits);
    },

    settings,
    Events: readiness.Events
  };
};

module.exports = SplitFactory;
