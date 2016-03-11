'use strict';

require('@splitsoftware/splitio');
var Split = global.splitio;

// This override the default implementation, so you MUST to be sure you include
// this AFTER the require('isomorphic-fetch')
var fetch = require('fetch-mock');

var tape = require('tape');
var url = require('@splitsoftware/splitio-utils/lib/url');

var splitChangesMock1 = require('./mocks/splitchanges.since.-1.json');
var splitChangesMock2 = require('./mocks/splitchanges.since.1457552620999.json');
var mySegmentsMock = require('./mocks/mysegments.facundo@split.io.json');

fetch.mock(url('/splitChanges?since=-1'), splitChangesMock1);
fetch.mock(url('/splitChanges?since=1457552620999'), splitChangesMock2);
fetch.mock(url('/mySegments/facundo@split.io'), mySegmentsMock);

tape('E2E ', function (assert) {
  var sdk = Split({
    core: {
      authorizationKey: '<fake-token>',
      key: 'facundo@split.io'
    },
    scheduler: {
      featuresRefreshRate: 1000,
      segmentsRefreshRate: 1000,
      metricsRefreshRate: 3000000,
      impressionsRefreshRate: 3000000
    }
  });

  assert.equal(sdk.getTreatment('blacklist'), 'control', 'Ask for `blacklist` before initialization');
  assert.equal(sdk.getTreatment('whitelist'), 'control', 'Ask for `whitelist` before initialization');
  assert.equal(sdk.getTreatment('splitters'), 'control', 'Ask for `splitters` before initialization');
  assert.equal(sdk.getTreatment('qc_team'), 'control', 'Ask for `qc_team` before initialization');

  sdk.ready().then(function () {
    assert.equal(sdk.getTreatment('blacklist'), 'not_allowed', 'Ask for `blacklist` after initialization');
    assert.equal(sdk.getTreatment('whitelist'), 'allowed', 'Ask for `whitelist` before initialization');
    assert.equal(sdk.getTreatment('splitters'), 'on', 'Ask for `splitters` before initialization');
    assert.equal(sdk.getTreatment('qc_team'), 'no', 'Ask for `qc_team` before initialization');
    assert.end();
  });
});
//# sourceMappingURL=e2e.spec.js.map