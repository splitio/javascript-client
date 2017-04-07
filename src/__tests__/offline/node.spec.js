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
    assert.equal(await client.getTreatment('qa-user', 'testing_split'), 'on');
    assert.equal(await client.getTreatment('qa-user', 'testing_split_2'), 'control');

    assert.deepEqual(await client.getTreatments('qa-user', [
      'testing_split', 'testing_split2', 'testing_split3', 'testing_not_exist'
    ]), {
      testing_split: 'on',
      testing_split2: 'off',
      testing_split3: 'custom_treatment',
      testing_not_exist: 'control'
    });

    client.destroy();
    assert.end();
  });
});
