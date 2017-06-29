// @flow

'use strict';

const get = require('lodash/get');

const ClientFactory = require('./client');
const keyParser = require('../utils/key/parser');

function FixKey(storage: SplitStorage, settings: Object): SplitClient {
  // In the browser land, the key is required
  keyParser(get(settings, 'core.key', undefined));

  const client = ClientFactory(storage);

  client.isBrowserClient = true;
  client.getTreatment = client.getTreatment.bind(client, settings.core.key);
  client.getTreatments = client.getTreatments.bind(client, settings.core.key);

  return client;
}

module.exports = FixKey;
