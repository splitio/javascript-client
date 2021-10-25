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

import objectAssign from 'object-assign';
import { merge } from '../lang';
import language from './language';
import runtime from './runtime';
import overridesPerPlatform from './defaults';
import storage from './storage';
import integrations from './integrations';
import mode from './mode';
import validateSplitFilters from '../inputValidation/splitFilters';
import { API } from '../../utils/logger';
import { STANDALONE_MODE, STORAGE_MEMORY, CONSUMER_MODE, OPTIMIZED } from '../../utils/constants';
import validImpressionsMode from './impressionsMode';

const version = '10.16.1';
const eventsEndpointMatcher = /^\/(testImpressions|metrics|events)/;
const authEndpointMatcher = /^\/v2\/auth/;
const streamingEndpointMatcher = /^\/(sse|event-stream)/;

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
    labelsEnabled: true,
    // toggle sendind (true) or not sending (false) IP and Host Name with impressions, events, and telemetries requests (only used on nodejs version)
    IPAddressesEnabled: undefined
  },

  scheduler: {
    // fetch feature updates each 30 sec
    featuresRefreshRate: 30,
    // fetch segments updates each 60 sec
    segmentsRefreshRate: 60,
    // publish metrics each 120 sec
    metricsRefreshRate: 120,
    // publish evaluations each 60 sec
    impressionsRefreshRate: 60,
    // fetch offline changes each 15 sec
    offlineRefreshRate: 15,
    // publish events every 60 seconds after the first flush
    eventsPushRate: 60,
    // how many events will be queued before flushing
    eventsQueueSize: 500,
    // backoff base seconds to wait before re attempting to connect to push notifications
    pushRetryBackoffBase: 1,
  },

  urls: {
    // CDN having all the information for your environment
    sdk: 'https://sdk.split.io/api',
    // Storage for your SDK events
    events: 'https://events.split.io/api',
    // SDK Auth Server
    auth: 'https://auth.split.io/api',
    // Streaming Server
    streaming: 'https://streaming.split.io',
  },

  // Defines which kind of storage we should instanciate.
  storage: {
    type: STORAGE_MEMORY
  },

  // Defines if the logs are enabled, SDK wide.
  debug: undefined,

  // Defines the impression listener, but will only be used on NodeJS.
  impressionListener: undefined,

  // Instance version.
  version: `${language}-${version}`,

  // List of integrations.
  integrations: undefined,

  // toggle using (true) or not using (false) Server-Side Events for synchronizing storage
  streamingEnabled: true,

  sync: {
    splitFilters: undefined,
    // impressions collection mode
    impressionsMode: OPTIMIZED
  }
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

  // Current ip/hostname information
  withDefaults.runtime = runtime(withDefaults.core.IPAddressesEnabled, withDefaults.mode === CONSUMER_MODE);

  // ensure a valid list of integrations.
  // `integrations` returns an array of valid integration items.
  withDefaults.integrations = integrations(withDefaults);

  // validate push options
  if (withDefaults.streamingEnabled !== false) {
    withDefaults.streamingEnabled = true;
    // Backoff bases.
    // We are not checking if bases are positive numbers. Thus, we might be reauthenticating immediately (`setTimeout` with NaN or negative number)
    withDefaults.scheduler.pushRetryBackoffBase = fromSecondsToMillis(withDefaults.scheduler.pushRetryBackoffBase);
  }

  // validate the `splitFilters` settings and parse splits query
  const splitFiltersValidation = validateSplitFilters(withDefaults.sync.splitFilters, withDefaults.mode);
  withDefaults.sync.splitFilters = splitFiltersValidation.validFilters;
  withDefaults.sync.__splitFiltersValidation = splitFiltersValidation;

  // ensure a valid impressionsMode
  withDefaults.sync.impressionsMode = validImpressionsMode(withDefaults.sync.impressionsMode);

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
    if (authEndpointMatcher.test(target)) {
      return `${this.urls.auth}${target}`;
    }
    if (streamingEndpointMatcher.test(target)) {
      return `${this.urls.streaming}${target}`;
    }
    return `${this.urls.sdk}${target}`;
  },

  /**
   * Returns a settings clone with the key and traffic type (if provided) overriden.
   * @param {SplitKey} key
   * @param {string} [trafficType]
   */
  overrideKeyAndTT(key, trafficType) {
    return objectAssign(
      Object.create(proto),
      this, {
        core: objectAssign({},
          this.core, {
            key,
            trafficType
          }
        )
      }
    );
  }
};

const SettingsFactory = (settings) => objectAssign(Object.create(proto), defaults(settings));

export default SettingsFactory;
