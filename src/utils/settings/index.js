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

// @flow

'use strict';

const merge = require('lodash/merge');

const language: string = require('./language');
const runtime: Object = require('./runtime');
const overridesPerPlatform: Object = require('./defaults');
const storage: Function = require('./storage');
const mode: Function = require('./mode');
const Logger = require('../../utils/logger');
const { version } = require('../../../package.json');

const eventsEndpointMatcher = /\/(testImpressions|metrics|events)/;

const base = {
  // Define which kind of object you want to retrieve from SplitFactory
  mode: 'standalone',

  core: {
    // API token (tight to an environment)
    authorizationKey: undefined,
    // key used in your system (only required for browser version)
    key: undefined,
    // traffic type for the given key (only used on browser version)
    trafficType: undefined,
    // toggle impressions tracking of labels
    labelsEnabled: true
  },

  scheduler: {
    // fetch feature updates each 30 sec
    featuresRefreshRate: 30,
    // fetch segments updates each 60 sec
    segmentsRefreshRate: 60,
    // publish metrics each 60 sec
    metricsRefreshRate: 60,
    // publish evaluations each 60 sec
    impressionsRefreshRate: 60,
    // fetch offline changes each 15 sec
    offlineRefreshRate: 15,
    // publish events every 60 seconds after the first flush
    eventsPushRate: 60,
    // how many events will be queued before flushing
    eventsQueueSize: 500
  },

  urls: {
    // CDN having all the information for your environment
    sdk: 'https://sdk.split.io/api',
    // Storage for your SDK events
    events: 'https://events.split.io/api'
  },

  // Defines which kind of storage we should instanciate.
  storage: {
    type: 'MEMORY'
  },

  // Defines if the logs are enabled, SDK wide.
  debug: false,

  // Instance version.
  version: `${language}-${version}`
};

function fromSecondsToMillis(n) {
  return Math.round(n * 1000);
}

function setupLogger(enable) {
  if (enable) {
    Logger.API.enable();
  }
}

function defaults(custom: Object) {
  const withDefaults = merge({}, base, overridesPerPlatform, custom);

  // Scheduler periods
  withDefaults.scheduler.featuresRefreshRate = fromSecondsToMillis(withDefaults.scheduler.featuresRefreshRate);
  withDefaults.scheduler.segmentsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.segmentsRefreshRate);
  withDefaults.scheduler.metricsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.metricsRefreshRate);
  withDefaults.scheduler.impressionsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.impressionsRefreshRate);
  withDefaults.scheduler.offlineRefreshRate = fromSecondsToMillis(withDefaults.scheduler.offlineRefreshRate);
  withDefaults.scheduler.eventsPushRate = fromSecondsToMillis(withDefaults.scheduler.eventsPushRate);

  // Startup periods
  withDefaults.startup.requestTimeoutBeforeReady = fromSecondsToMillis(withDefaults.startup.requestTimeoutBeforeReady);
  withDefaults.startup.readyTimeout = fromSecondsToMillis(withDefaults.startup.readyTimeout);
  withDefaults.startup.eventsFirstPushWindow = fromSecondsToMillis(withDefaults.startup.eventsFirstPushWindow);

  // ensure a valid SDK mode
  withDefaults.mode = mode(withDefaults.core.authorizationKey, withDefaults.mode);

  // ensure a valid Storage based on mode defined.
  withDefaults.storage = storage(withDefaults);

  setupLogger(withDefaults.debug);

  return withDefaults;
}

const proto = {
  // Switch URLs servers based on target.
  url(target): string {
    if (eventsEndpointMatcher.test(target)) {
      return `${this.urls.events}${target}`;
    }

    return `${this.urls.sdk}${target}`;
  },

  /**
   * Returns a settings clone with the key and traffic type (if provided) overriden.
   * @param {SplitKey} key
   * @param {string} [trafficType]
   */
  overrideKeyAndTT(key: SplitKey, trafficType: ?String): Settings {
    const overrides = { key };
    if (typeof trafficType === 'string') overrides.trafficType = trafficType;

    return Object.assign(
      Object.create(proto), {
        ...this,
        core: {
          ...this.core,
          ...overrides
        }
      }
    );
  },

  // Current ip/hostname information (if available)
  runtime
};

const SettingsFactory = (settings: Object): Settings => Object.assign(Object.create(proto), defaults(settings));

module.exports = SettingsFactory;
