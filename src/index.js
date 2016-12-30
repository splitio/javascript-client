/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

// @flow

'use strict';

const ClientFactory = require('./client');
const ManagerFactory = require('./manager');

const SettingsFactory = require('./utils/settings');
const EventsFactory = require('./utils/events');

const StorageFactory = require('./storage');

const ProducerFactory = require('./producer');

const SplitFactory = (config: Object) => {
  const settings = SettingsFactory(config);
  const storage = StorageFactory(settings.storage);
  const client = ClientFactory(storage);
  const producer = ProducerFactory(settings, storage);

  return {
    client(): SplitClient {
      return client;
    },

    manager(): SplitManager {
      return ManagerFactory(storage);
    },

    producer() {
      return producer;
    }
  };
};

module.exports = SplitFactory;
