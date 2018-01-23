'use strict';

const tape = require('tape-catch');
const SplitFactory = require('../');
const SDK_INSTANCES_TO_TEST = 4;

tape('NodeJS E2E', function (assert) {
  let i = 0, tested = 0;

  const assertionSuite = client => {
    assert.comment('QA User');
    assert.equal(client.getTreatment('qa-user', 'always-off'), 'off');
    assert.equal(client.getTreatment('qa-user', 'always-on'), 'on');
    assert.equal(client.getTreatment('qa-user', 'on-if-in-segment-qa'), 'on');
    assert.equal(client.getTreatment('qa-user', 'on-if-in-segment-qc'), 'off');

    assert.deepEqual(client.getTreatments('qa-user', [
      'always-off',
      'always-on',
      'on-if-in-segment-qa',
      'on-if-in-segment-qc'
    ]), {
      'always-off': 'off',
      'always-on': 'on',
      'on-if-in-segment-qa': 'on',
      'on-if-in-segment-qc': 'off'
    });

    assert.comment('QC User');
    assert.equal(client.getTreatment('qc-user', 'always-off'), 'off');
    assert.equal(client.getTreatment('qc-user', 'always-on'), 'on');
    assert.equal(client.getTreatment('qc-user', 'on-if-in-segment-qa'), 'off');
    assert.equal(client.getTreatment('qc-user', 'on-if-in-segment-qc'), 'on');

    assert.deepEqual(client.getTreatments('qc-user', [
      'always-off',
      'always-on',
      'on-if-in-segment-qa',
      'on-if-in-segment-qc'
    ]), {
      'always-off': 'off',
      'always-on': 'on',
      'on-if-in-segment-qa': 'off',
      'on-if-in-segment-qc': 'on'
    });

    client.destroy();
  };

  const config = {
    core: {
      authorizationKey: 'i5du10bq0o6328ousp9a3i9n5k0uit2gov3i'
    },
    scheduler: {
      featuresRefreshRate: 15,
      segmentsRefreshRate: 15
    }
  };


  for(i; i < SDK_INSTANCES_TO_TEST; i++) {
    const factory = SplitFactory(config);
    const client = factory.client();

    client.ready().then(() => {
      assertionSuite(client);
      tested++;

      if (tested === SDK_INSTANCES_TO_TEST) {
        assert.end();
      }
    });
  }

});
