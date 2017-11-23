// @flow

'use strict';

const get = require('lodash/get');

const ClientFactory = require('./client');
const keyParser = require('../utils/key/parser');

function FixKey(context): SplitClient {
  const settings = context.get(context.constants.SETTINGS);
  let key = get(settings, 'core.key', undefined);
  let tt = get(settings, 'core.trafficType', undefined);

  if (settings.mode === 'localhost' && key === undefined) {
    settings.core.key = 'localhost_key';
  } else {
    keyParser(key);
  }

  const client = ClientFactory(context);
  client.isBrowserClient = true;

  // In the browser land, the key is required on the settings, so we can bind it to getTretment/s
  client.getTreatment = client.getTreatment.bind(client, settings.core.key);
  client.getTreatments = client.getTreatments.bind(client, settings.core.key);

  // Key is also binded to the .track method. Same thing happens with trafficType but only if present on configs. (not required)
  const trackBindings = [settings.core.key];
  if (tt) {
    trackBindings.push(tt);
  }
  client.track = client.track.bind(client, ...trackBindings);

  return client;
}

module.exports = FixKey;
