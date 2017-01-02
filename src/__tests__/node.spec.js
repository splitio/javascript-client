// @flow

'use strict';

const tape = require('tape-catch');
const SplitFactory = require('../index');

tape('CLIENT', async function (assert) {
  const config = {
    core: {
      authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib'
    },
    scheduler: {
      featuresRefreshRate: 15,
      segmentsRefreshRate: 15
    },
    urls: {
      sdk: 'https://sdk-aws-staging.split.io/api',
      events: 'https://events-aws-staging.split.io/api'
    },
    storage: {
      type: 'REDIS',
      options: 'redis://localhost:32768/0'
    }
  };
  const api = SplitFactory(config);
  const client = api.client();
  const producer = api.producer();

  producer.start();

  setTimeout(async function test() {
    const treatment = await client.getTreatment('aKey', 'new-storage-approach');

    assert.ok(treatment === 'off');

    setTimeout(test, 1500);
  }, 1500);

  // assert.end();
});
