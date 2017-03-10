// @flow

'use strict';

const tape = require('tape');
const SplitFactory = require('../../');

tape('Browser offline mode', function (assert) {
  const config = {
    core: {
      authorizationKey: 'localhost',
      key: 'facundo@split.io'
    },
    scheduler: {
      offlineRefreshRate: 3
    },
    features: {
      testing_split: 'on'
    }
  };
  const factory = SplitFactory(config);
  const client = factory.client();

  client.on(client.Event.SDK_READY, async function () {
    assert.equal(await client.getTreatment('testing_split'), 'on');
    assert.equal(await client.getTreatment('testing_split_2'), 'control');

    factory.settings.features = {
      testing_split: 'on',
      testing_split_2: 'off'
    };

    setTimeout(async function () {
      assert.equal(await client.getTreatment('testing_split_2'), 'off');

      client.destroy();
      assert.end();
    }, 3000);
  });
});
