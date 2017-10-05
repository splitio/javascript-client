// @flow

'use strict';

const get = require('lodash/get');

const ClientFactory = require('./client');
const keyParser = require('../utils/key/parser');

function FixKey(context): SplitClient {
  const settings = context.get(context.constants.SETTINGS);
  let key = get(settings, 'core.key', undefined);

  if (settings.mode === 'localhost' && key === undefined) {
    settings.core.key = 'localhost_key';
  } else {
    keyParser(key);
  }

  const client = ClientFactory(context);
  // In the browser land, the key is required
  client.isBrowserClient = true;
  client.getTreatment = client.getTreatment.bind(client, settings.core.key);
  client.getTreatments = client.getTreatments.bind(client, settings.core.key);

  return client;
}

module.exports = FixKey;
