// @flow

'use strict';

const tape = require('tape');
const SplitFactory = require('../../');

tape('Browser offline mode', function (assert) {
  const config = {
    core: {
      authorizationKey: 'localhost'
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
  const sharedClient = factory.client('nicolas.zelaya@split.io');

  client.on(client.Event.SDK_READY, function () {
    // Check the information through the client original instance
    assert.equal(client.getTreatment('testing_split'), 'on');
    assert.equal(client.getTreatment('testing_split_2'), 'control');

    assert.deepEqual(client.getTreatments([
    'testing_split',
    'testing_split_2'
    ]), {
      testing_split: 'on',
      testing_split_2: 'control'
    });
    // And then through the shared instance.
    assert.equal(sharedClient.getTreatment('testing_split'), 'on');
    assert.equal(sharedClient.getTreatment('testing_split_2'), 'control');

    assert.deepEqual(sharedClient.getTreatments([
    'testing_split',
    'testing_split_2'
    ]), {
      testing_split: 'on',
      testing_split_2: 'control'
    });

    // Update the features.
    factory.settings.features = {
      testing_split: 'on',
      testing_split_2: 'off',
      testing_split_3: 'custom_treatment'
    };
    // We allow the SDK to process the feature changes and then test again..
    setTimeout(function () {
      assert.equal(client.getTreatment('testing_split_2'), 'off');
      assert.equal(client.getTreatment('testing_split_3'), 'custom_treatment');

      assert.deepEqual(client.getTreatments([
        'testing_split',
        'testing_split_2',
        'testing_split_3',
        'testing_not_exist'
      ]), {
        testing_split: 'on',
        testing_split_2: 'off',
        testing_split_3: 'custom_treatment',
        testing_not_exist: 'control'
      });
      // Test shared client for the same data
      assert.equal(sharedClient.getTreatment('testing_split_2'), 'off');
      assert.equal(sharedClient.getTreatment('testing_split_3'), 'custom_treatment');

      assert.deepEqual(sharedClient.getTreatments([
      'testing_split',
      'testing_split_2',
      'testing_split_3',
      'testing_not_exist'
      ]), {
        testing_split: 'on',
        testing_split_2: 'off',
        testing_split_3: 'custom_treatment',
        testing_not_exist: 'control'
      });

      client.destroy();
      sharedClient.destroy();
      assert.end();
    }, 3500);
  });
});
