'use strict';

/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

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

tape('E2E', function (assert) {
  var sdk = Split({
    core: {
      authorizationKey: '<fake-token>',
      key: 'facundo@split.io'
    },
    scheduler: {
      featuresRefreshRate: 1,
      segmentsRefreshRate: 1,
      metricsRefreshRate: 3000, // for now I don't want to publish metrics during E2E run.
      impressionsRefreshRate: 3000 // for now I don't want to publish impressions during E2E run.
    }
  });

  assert.equal(sdk.getTreatment('blacklist'), 'control', 'control should be return');
  assert.equal(sdk.getTreatment('whitelist'), 'control', 'control should be return');
  assert.equal(sdk.getTreatment('splitters'), 'control', 'control should be return');
  assert.equal(sdk.getTreatment('qc_team'), 'control', 'control should be return');
  assert.equal(sdk.getTreatment('attr_between_dates'), 'control', 'control should be return');

  sdk.ready().then(function () {
    assert.equal(sdk.getTreatment('blacklist'), 'not_allowed', 'Ask for `blacklist` after initialization');
    assert.equal(sdk.getTreatment('whitelist'), 'allowed', 'Ask for `whitelist` before initialization');
    assert.equal(sdk.getTreatment('splitters'), 'on', 'Ask for `splitters` before initialization');
    assert.equal(sdk.getTreatment('qc_team'), 'no', 'Ask for `qc_team` before initialization');
    assert.equal(sdk.getTreatment('attr_between_dates'), 'control', 'invalid rules should return control');
    assert.end();
  });
});
//# sourceMappingURL=e2e.spec.js.map