// @flow

'use strict';

const tape = require('tape-catch');

const Settings = require('../../utils/settings');
const Events = require('../../utils/events');

const Producer = require('../index');

tape('PRODUCER / ', function ( assert ) {
  const settings = Settings({
    core: {
      authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib'
    },
    scheduler: {
      featuresRefreshRate: 15,
      segmentsRefreshRate: 15,
      metricsRefreshRate: 30,
      impressionsRefreshRate: 30
    },
    urls: {
      sdk: 'https://sdk-aws-staging.split.io/api',
      events: 'https://events-aws-staging.split.io/api'
    },
    storage: {
      type: 'REDIS',
      options: 'redis://localhost:32768/0'
    }
  });
  const hub = Events();

  Producer(settings, hub).start();

  assert.end();
});
