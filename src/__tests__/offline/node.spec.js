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
      offlineRefreshRate: 5
    },
    features: path.join(__dirname, '.split')
  };
  const factory = SplitFactory(config);
  const client = factory.client();
  const events = client.events();

  events.on(events.SDK_READY, async function () {
    assert.comment('QA User');
    assert.equal(await client.getTreatment('qa-user', 'always-off'), 'off');
    assert.equal(await client.getTreatment('qa-user', 'always-on'), 'on');
    assert.equal(await client.getTreatment('qa-user', 'on-if-in-segment-qa'), 'on');
    assert.equal(await client.getTreatment('qa-user', 'on-if-in-segment-qc'), 'off');

    assert.comment('QC User');
    assert.equal(await client.getTreatment('qc-user', 'always-off'), 'off');
    assert.equal(await client.getTreatment('qc-user', 'always-on'), 'on');
    assert.equal(await client.getTreatment('qc-user', 'on-if-in-segment-qa'), 'off');
    assert.equal(await client.getTreatment('qc-user', 'on-if-in-segment-qc'), 'on');

    client.destroy();

    assert.end();
  });

});
