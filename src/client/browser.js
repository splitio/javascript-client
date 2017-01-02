// @flow

'use strict';

const SplitClientFactory = require('./client');

function FixKey(storage: SplitStorage, settings: Object): SplitClient {
  const client = SplitClientFactory(storage);

  client.getTreatment = client.getTreatment.bind(client, settings.core.key);

  return client;
}

module.exports = FixKey;
