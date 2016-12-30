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
'use strict';

const splitio = require('../core');

// This override the default implementation, so you MUST to be sure you include
// this AFTER the require('isomorphic-fetch')
const fetchMock = require('fetch-mock');

const tape = require('tape-catch');
const SettingsFactory = require('../utils/settings');
const settings = SettingsFactory({
  core: {
    authorizationKey: '<fake-token>'
  }
});

const splitChangesMock1 = require('./mocks/splitchanges.since.-1.json');
const splitChangesMock2 = require('./mocks/splitchanges.since.1457552620999.json');
const mySegmentsMock = require('./mocks/mysegments.facundo@split.io.json');

fetchMock.mock(settings.url('/splitChanges?since=-1'), splitChangesMock1);
fetchMock.mock(settings.url('/splitChanges?since=1457552620999'), splitChangesMock2);
fetchMock.mock(settings.url('/mySegments/facundo@split.io'), mySegmentsMock);

tape('E2E / lets evaluates!', assert => {
  const sdk = splitio({
    core: {
      authorizationKey: '<fake-token>',
      key: 'facundo@split.io'
    },
    scheduler: {
      featuresRefreshRate:    1,
      segmentsRefreshRate:    1,
      metricsRefreshRate:     3000, // for now I don't want to publish metrics during E2E run.
      impressionsRefreshRate: 3000  // for now I don't want to publish impressions during E2E run.
    }
  });

  // Monitor the SDK state and execute the tests once we have the ready flag ON.
  const readyPromise = new Promise(function readiness(resolve, reject) {
    sdk.on(sdk.Event.SDK_READY, resolve);
    sdk.on(sdk.Event.SDK_READY_TIMED_OUT, reject);
  });

  // All these tests should ALWAYS return control because the SDK is starting UP (asyncronously).
  assert.equal(sdk.getTreatment('blacklist'), 'control', 'control should be return');
  assert.equal(sdk.getTreatment('whitelist'), 'control', 'control should be return');
  assert.equal(sdk.getTreatment('splitters'), 'control', 'control should be return');
  assert.equal(sdk.getTreatment('qc_team'), 'control', 'control should be return');

  // Once the SDK is ready, verify the SDK behavior.
  readyPromise.then(() => {
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

    assert.equal(sdk.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T17:55:47.021Z').getTime()
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T21:34:44.077Z').getTime()
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077'), 'off');

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

    assert.equal(sdk.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-16T17:55:47.021Z').getTime()
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-17T19:55:47.021Z').getTime()
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_lte_datetime_1458240947021'), 'off');

    assert.equal(sdk.getTreatment('user_attr_lte_number_10', {
      attr: 9
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_number_10', {
      attr: 10
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_number_10', {
      attr: 11
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_lte_number_10'), 'off');

    assert.equal(sdk.getTreatment('user_attr_lte_10', {
      attr: 9
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_10', {
      attr: 10
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_lte_10', {
      attr: 11
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_lte_10'), 'off');

    assert.equal(sdk.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T19:55:47.021Z').getTime()
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T17:55:47.021Z').getTime()
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_gte_datetime_1458240947021'), 'off');

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

    assert.equal(sdk.getTreatment('user_attr_eq_datetime_1458240947021', {
      attr: new Date('2016-03-17T00:00:00Z').getTime()
    }), 'on');
    assert.equal(sdk.getTreatment('user_attr_eq_datetime_1458240947021', {
      attr: new Date('2016-03-16T10:01:10Z').getTime()
    }), 'off');
    assert.equal(sdk.getTreatment('user_attr_eq_datetime_1458240947021'), 'off');

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

    sdk.destroy();
    assert.end();
  }).catch((err) => {
    assert.fail(err);
  });
});

tape('E2E / allow multiple instances when running offline', assert => {
  const sdk1 = splitio({
    core: {
      authorizationKey: 'localhost',
      key: 'facundo@split.io'
    },
    features: {
      my_new_feature: 'on'
    }
  });
  const sdk2 = splitio({
    core: {
      authorizationKey: 'localhost',
      key: 'facundo@split.io'
    },
    features: {
      my_new_feature: 'off'
    }
  });

  const sdkOneReady = new Promise(function readiness(resolve, reject) {
    sdk1.on(sdk1.Event.SDK_READY, resolve);
    sdk1.on(sdk1.Event.SDK_READY_TIMED_OUT, reject);
  });
  const sdkTwoReady = new Promise(function readiness(resolve, reject) {
    sdk2.on(sdk2.Event.SDK_READY, resolve);
    sdk2.on(sdk2.Event.SDK_READY_TIMED_OUT, reject);
  });

  Promise.all([sdkOneReady, sdkTwoReady]).then(() => {
    assert.equal(sdk1.getTreatment('my_new_feature'), 'on', 'should evaluates to on');
    assert.equal(sdk1.getTreatment('unknown_feature'), 'control', 'should evaluates to control');

    assert.equal(sdk2.getTreatment('my_new_feature'), 'off', 'should evaluates to on');
    assert.equal(sdk2.getTreatment('unknown_feature'), 'control', 'should evaluates to control');

    sdk1.destroy();
    sdk2.destroy();

    assert.end();
  }).catch((err) => {
    assert.fail(err);
  });
});

tape('E2E / evaluates a feature in offline mode', assert => {
  const sdk = splitio({
    core: {
      authorizationKey: 'localhost',
      key: 'facundo@split.io'
    },
    features: {
      my_new_feature: 'on'
    }
  });

  sdk.on(sdk.Event.SDK_READY, () => {
    assert.equal(sdk.getTreatment('my_new_feature'), 'on', 'should evaluates to on');
    assert.equal(sdk.getTreatment('unknown_feature'), 'control', 'should evaluates to control');

    sdk.destroy();
    assert.end();
  });
});
