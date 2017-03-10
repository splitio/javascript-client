'use strict';

const tape = require('tape');
const SplitFactory = require('../../');

tape('SDK BROWSER / shared instanciation', function (assert) {
  const config = {
    core: {
      authorizationKey: '5i7avi2rpj8i7qg99fhmc38244kcineavla0',
      key: 'qc-user'
    },
    urls: {
      sdk: 'https://sdk-aws-staging.split.io/api',
      events: 'https://events-aws-staging.split.io/api'
    }
  };

  const factory = SplitFactory(config);
  const qcUserClient = factory.client();
  const qaUserClient = factory.client('qa-user');

  const finished = (function* f() {
    yield;
    assert.end();
  })();

  async function assertionQA() {
    assert.comment('QA User');
    assert.equal(await qaUserClient.getTreatment('always-off'), 'off');
    assert.equal(await qaUserClient.getTreatment('always-on'), 'on');
    assert.equal(await qaUserClient.getTreatment('on-if-in-segment-qa'), 'on');
    assert.equal(await qaUserClient.getTreatment('on-if-in-segment-qc'), 'off');

    finished.next();
  }

  async function assertionQC() {
    assert.comment('QC User');
    assert.equal(await qcUserClient.getTreatment('always-off'), 'off');
    assert.equal(await qcUserClient.getTreatment('always-on'), 'on');
    assert.equal(await qcUserClient.getTreatment('on-if-in-segment-qa'), 'off');
    assert.equal(await qcUserClient.getTreatment('on-if-in-segment-qc'), 'on');

    finished.next();
  }

  qcUserClient.ready().then(assertionQA);
  qaUserClient.ready().then(assertionQC);
});
