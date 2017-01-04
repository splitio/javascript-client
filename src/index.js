// @flow

'use strict';

const ClientFactory = require('./client');
const ManagerFactory = require('./manager');
const SettingsFactory = require('./utils/settings');
const EventsFactory = require('./utils/events');
const StorageFactory = require('./storage');
const ProducerFactory = require('./producer');
const MetricsFactory = require('./metrics');

const SplitFactory = (config: Object) => {
  const settings = SettingsFactory(config);
  const hub = EventsFactory();
  const storage = StorageFactory(settings.storage);
  const client = Object.assign(ClientFactory(storage, settings), {
    events() {
      return hub;
    }
  });
  const producer = ProducerFactory(settings, hub, storage);
  const metrics = MetricsFactory(settings, storage);

  // start the race vs the SDK startup!
  if (settings.startup.readyTimeout > 0) {
    setTimeout(() => {
      hub.emit(hub.SDK_READY_TIMED_OUT);
    }, settings.startup.readyTimeout);
  }

  return {
    client(): SplitClient {
      return client;
    },

    manager(): SplitManager {
      return ManagerFactory(storage);
    },

    producer(): Startable {
      return producer;
    },

    metrics(): Startable {
      return metrics;
    },

    settings(): Object {
      return settings;
    }
  };
};

module.exports = SplitFactory;
