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

const eventsEndpointMatcher = /\/(testImpressions|metrics)/;

const base = {
  // Define which kind of object you want to retrieve from SplitFactory
  mode: 'standalone',

  core: {
    // API token (tight to an environment)
    authorizationKey: undefined,
    // key used in your system (only required for browser version)
    key: undefined,
    // toggle impressions tracking of labels
    labelsEnabled: false
  },

  scheduler: {
    // fetch feature updates each 30 sec
    featuresRefreshRate: 30,
    // fetch segments updates each 60 sec
    segmentsRefreshRate: 60,
    // publish metrics each 60 sec
    metricsRefreshRate: 60,
    // publish evaluations each 60 sec
    impressionsRefreshRate: 60
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

  // Instance version.
  version: `${language}-8.0.0-canary.9`
};

function fromSecondsToMillis(n) {
  return Math.round(n * 1000);
}

function defaults(custom: Object): Settings {
  const withDefaults = merge(base, overridesPerPlatform, custom);

  withDefaults.scheduler.featuresRefreshRate = fromSecondsToMillis(withDefaults.scheduler.featuresRefreshRate);
  withDefaults.scheduler.segmentsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.segmentsRefreshRate);
  withDefaults.scheduler.metricsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.metricsRefreshRate);
  withDefaults.scheduler.impressionsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.impressionsRefreshRate);
  withDefaults.startup.requestTimeoutBeforeReady = fromSecondsToMillis(withDefaults.startup.requestTimeoutBeforeReady);
  withDefaults.startup.readyTimeout = fromSecondsToMillis(withDefaults.startup.readyTimeout);

  return withDefaults;
}

const proto = {
  /**
   * Switch URLs servers based on target.
   */
  url(target): string {
    if (eventsEndpointMatcher.test(target)) {
      return `${this.urls.events}${target}`;
    }

    return `${this.urls.sdk}${target}`;
  },

  /**
   * Override key on a given configuration object
   */
  overrideKey(newKey: string): Settings {
    return Object.assign(
      Object.create(proto),
      {
        ...this,
        core: {
          ...this.core,
          key: newKey
        }
      }
    );
  },

  // Current ip/hostname information (if available)
  runtime
};

const SettingsFactory = (settings: Object): Settings => {
  return Object.assign(
    Object.create(proto),
    defaults(settings),
    runtime
  );
};

module.exports = SettingsFactory;
