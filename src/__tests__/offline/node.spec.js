// @flow

'use strict';

const tape = require('tape-catch');
const SplitFactory = require('../../');

const path = require('path');

tape('NodeJS Offline mode', function (assert) {
  const config = {
    core: {
      authorizationKey: 'localhost'
    },
    scheduler: {
      offlineRefreshRate: 3
    },
    features: path.join(__dirname, '.split')
  };
  const factory = SplitFactory(config);
  const client = factory.client();

  client.on(client.Event.SDK_READY, async function () {
    // setTimeout(async function self() {
    assert.equal(await client.getTreatment('qa-user', 'testing_split'), 'on');
    assert.equal(await client.getTreatment('qa-user', 'testing_split_2'), 'control');

    //   setTimeout(self, 5000);
    // }, 5000);

    client.destroy();
    assert.end();
  });
});
