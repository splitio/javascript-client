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
var _ = require('lodash');
var tape = require('tape');
var SettingsFactory = require('../../../lib/settings');

tape('SETTINGS / check defaults', function (assert) {
  var settings = SettingsFactory({
    core: {
      authorizationKey: 'dummy token'
    }
  });

  assert.deepEqual(settings.get('urls'), {
    sdk: 'https://sdk.split.io/api',
    events: 'https://events.split.io/api'
  });
  assert.end();
});

tape('SETTINGS / urls should be configurable', function (assert) {
  var urls = {
    sdk: 'sdk-url',
    events: 'events-url'
  };

  var settings = SettingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    urls: urls
  });

  assert.deepEqual(settings.get('urls'), urls);
  assert.end();
});

tape('SETTINGS / required properties should be always present', function (assert) {
  var locatorAuthorizationKey = _.property('core.authorizationKey');

  var locatorSchedulerFeaturesRefreshRate = _.property('scheduler.featuresRefreshRate');
  var locatorSchedulerSegmentsRefreshRate = _.property('scheduler.segmentsRefreshRate');
  var locatorSchedulerMetricsRefreshRate = _.property('scheduler.metricsRefreshRate');
  var locatorSchedulerImpressionsRefreshRate = _.property('scheduler.impressionsRefreshRate');

  var locatorUrlsSDK = _.property('urls.sdk');
  var locatorUrlsEvents = _.property('urls.events');

  var locatorStartupRequestTimeoutBeforeReady = _.property('startup.requestTimeoutBeforeReady');
  var locatorStartupRetriesOnFailureBeforeReady = _.property('startup.retriesOnFailureBeforeReady');
  var locatorStartupReadyTimeout = _.property('startup.readyTimeout');

  var settings = SettingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    scheduler: {
      featuresRefreshRate: undefined,
      segmentsRefreshRate: undefined,
      metricsRefreshRate: undefined,
      impressionsRefreshRate: undefined
    },
    urls: {
      sdk: undefined,
      events: undefined
    },
    startup: {
      requestTimeoutBeforeReady: undefined,
      retriesOnFailureBeforeReady: undefined,
      readyTimeout: undefined
    }
  });

  assert.ok(locatorAuthorizationKey(settings) !== undefined, 'authorizationKey should be present');

  assert.ok(locatorSchedulerFeaturesRefreshRate(settings) !== undefined, 'scheduler.featuresRefreshRate should be present');
  assert.ok(locatorSchedulerSegmentsRefreshRate(settings) !== undefined, 'scheduler.segmentsRefreshRate should be present');
  assert.ok(locatorSchedulerMetricsRefreshRate(settings) !== undefined, 'scheduler.metricsRefreshRate should be present');
  assert.ok(locatorSchedulerImpressionsRefreshRate(settings) !== undefined, 'scheduler.impressionsRefreshRate should be present');

  assert.ok(locatorUrlsSDK(settings) !== undefined, 'urls.sdk should be present');
  assert.ok(locatorUrlsEvents(settings) !== undefined, 'urls.events should be present');

  assert.ok(locatorStartupRequestTimeoutBeforeReady(settings) !== undefined, 'startup.requestTimeoutBeforeReady should be present');
  assert.ok(locatorStartupRetriesOnFailureBeforeReady(settings) !== undefined, 'startup.retriesOnFailureBeforeReady should be present');
  assert.ok(locatorStartupReadyTimeout(settings) !== undefined, 'startup.readyTimeout should be present');

  assert.end();
});