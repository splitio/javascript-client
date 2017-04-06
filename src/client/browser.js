// @flow

'use strict';

const ClientFactory = require('./client');

function FixKey(settings: Object, storage: SplitStorage): SplitClient {
  const client = ClientFactory(settings, storage);

  client.getTreatment = client.getTreatment.bind(client, settings.core.key);
  client.getTreatments = client.getTreatments.bind(client, settings.core.key);

  return client;
}

module.exports = FixKey;
