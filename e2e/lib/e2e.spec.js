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

tape('E2E ', function (assert) {
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

  assert.equal(sdk.getTreatment('blacklist'), 'control', 'Ask for `blacklist` before initialization');
  assert.equal(sdk.getTreatment('whitelist'), 'control', 'Ask for `whitelist` before initialization');
  assert.equal(sdk.getTreatment('splitters'), 'control', 'Ask for `splitters` before initialization');
  assert.equal(sdk.getTreatment('qc_team'), 'control', 'Ask for `qc_team` before initialization');

  sdk.ready().then(function () {
    assert.equal(sdk.getTreatment('blacklist'), 'not_allowed');
    assert.equal(sdk.getTreatment('whitelist'), 'allowed');
    assert.equal(sdk.getTreatment('splitters'), 'on');
    assert.equal(sdk.getTreatment('qc_team'), 'no');

    assert.equal(sdk.getTreatment('employees_between_21_and_50_and_chrome'), 'off');
    assert.equal(sdk.getTreatment('employees_between_21_and_50_and_chrome', {
      age: 21
    }), 'off');
    assert.equal(sdk.getTreatment('employees_between_21_and_50_and_chrome', {
      age: 20,
      agent: 'chrome'
    }), 'off');
    assert.equal(sdk.getTreatment('employees_between_21_and_50_and_chrome', {
      age: 21,
      agent: 'chrome'
    }), 'on');

    assert.equal(sdk.getTreatment('user_attr_gte_10_and_user_attr2_is_not_foo'), 'off');
    assert.equal(sdk.getTreatment('user_attr_gte_10_and_user_attr2_is_not_foo', {
      attr: 55,
      attr2: 'bar'
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_10_and_user_attr2_is_not_foo', {
      attr: 55,
      attr2: 'foo'
    }), 'off');

    assert.equal(sdk.getTreatment('user_account_in_whitelist'), 'off');
    assert.equal(sdk.getTreatment('user_account_in_whitelist', {
      account: 'key_1@split.io'
    }), 'on');
    assert.equal(sdk.getTreatment('user_account_in_whitelist', {
      account: 'key_6@split.io'
    }), 'off');

    // This is an special case for the browser.
    assert.equal(sdk.getTreatment('user_account_in_segment_employees'), 'off');
    assert.equal(sdk.getTreatment('user_account_in_segment_employees', {
      account: 'key_1@split.io'
    }), 'off');

    assert.equal(sdk.getTreatment('user_account_in_segment_all'), 'off');
    assert.equal(sdk.getTreatment('user_account_in_segment_all', {
      account: 'something'
    }), 'on');

    assert.equal(sdk.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077'), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: 1458240947021
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: 1458240947020
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_btw_number_10_and_20'), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_number_10_and_20', {
      attr: 9
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_number_10_and_20', {
      attr: 21
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_number_10_and_20', {
      attr: 15
    }), 'on');

    assert.equal(sdk.getTreatment('user_attr_btw_10_and_20'), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_10_and_20', {
      attr: 9
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_10_and_20', {
      attr: 21
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_10_and_20', {
      attr: 15
    }), 'on');

    assert.equal(sdk.getTreatment('user_attr_lte_datetime_1458240947021'), 'off');
    assert.equal(sdk.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: 1458240947021
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: 1458240947020
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: 1458240947022
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_lte_number_10'), 'off');
    assert.equal(sdk.getTreatment('user_attr_lte_number_10', {
      attr: 9
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_number_10', {
      attr: 10
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_number_10', {
      attr: 11
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_lte_10'), 'off');
    assert.equal(sdk.getTreatment('user_attr_lte_10', {
      attr: 9
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_10', {
      attr: 10
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_10', {
      attr: 11
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_gte_datetime_1458240947021'), 'off');
    assert.equal(sdk.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: 1458240947021
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: 1458240947300
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: 1458240947020
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_gte_number_10'), 'off');
    assert.equal(sdk.getTreatment('user_attr_gte_number_10', {
      attr: 10
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_number_10', {
      attr: 11
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_number_10', {
      attr: 0
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_gte_10'), 'off');
    assert.equal(sdk.getTreatment('user_attr_gte_10', {
      attr: 10
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_10', {
      attr: 11
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_10', {
      attr: 0
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_eq_datetime_1458240947021'), 'off');
    assert.equal(sdk.getTreatment('user_attr_eq_datetime_1458240947021', {
      attr: 1458240947021
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_eq_datetime_1458240947021', {
      attr: 11
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_eq_number_ten'), 'off');
    assert.equal(sdk.getTreatment('user_attr_eq_number_ten', {
      attr: 10
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_eq_number_ten', {
      attr: 9
    }), 'off');

    assert.equal(sdk.getTreatment('user_attr_eq_ten'), 'off');
    assert.equal(sdk.getTreatment('user_attr_eq_ten', {
      attr: 10
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_eq_ten', {
      attr: 9
    }), 'off');

    assert.end();
  });
});
//# sourceMappingURL=e2e.spec.js.map