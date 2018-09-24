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

import { merge } from '../lang';
import language from './language';
import { ip, hostname } from './runtime';
import overridesPerPlatform from './defaults';
import storage from './storage';
import mode from './mode';
import { API } from '../../utils/logger';
import { STANDALONE_MODE, STORAGE_MEMORY } from '../../utils/constants';
import { version } from '../../../package.json';

const eventsEndpointMatcher = /\/(testImpressions|metrics|events)/;

const base = {
  // Define which kind of object you want to retrieve from SplitFactory
  mode: STANDALONE_MODE,

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
    type: STORAGE_MEMORY
  },

  // Defines if the logs are enabled, SDK wide.
  debug: false,

  // Instance version.
  version: `${language}-${version}`
};

function fromSecondsToMillis(n) {
  return Math.round(n * 1000);
}

function setupLogger(debugValue) {
  if (typeof debugValue === 'boolean') {
    if (debugValue) {
      API.enable();
    } else {
      API.disable();
    }
  } else if (typeof debugValue === 'string') {
    API.setLogLevel(debugValue);
  }
}

function defaults(custom) {
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
  /**
   * Switch URLs servers based on target.
   *
   * @param {String} target url target
   * @return {String} completed url
   */
  url(target) {
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
  overrideKeyAndTT(key, trafficType) {
    return Object.assign(
      Object.create(proto), {
        ...this,
        core: {
          ...this.core,
          key,
          trafficType
        }
      }
    );
  },

  // Current ip/hostname information (if available)
  runtime: {
    ip,
    hostname
  }
};

const SettingsFactory = (settings) => Object.assign(Object.create(proto), defaults(settings));

export default SettingsFactory;
