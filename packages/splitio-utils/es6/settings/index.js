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

/*::
type Settings = {
  core: {
    authorizationKey: string,
    key: ?string
  },
  scheduler: {
    featuresRefreshRate: number,
    segmentsRefreshRate: number,
    metricsRefreshRate: number,
    impressionsRefreshRate: number
  },
  urls: {
    sdk: string,
    events: string
  },
  startup: {
    requestTimeoutBeforeReady: number,
    retriesOnFailureBeforeReady: number,
    readyTimeout: number
  }
};
*/
const merge = require('lodash/merge');

const eventsEndpointMatcher = /\/(testImpressions|metrics)/;

function fromSecondsToMillis(n) {
  return Math.round(n * 1000);
}

function defaults(custom /*: Settings */) /*: Settings */ {
  let init = {
    core: {
      // API token (tight to an environment)
      authorizationKey: undefined,
      // key used in your system (only required for browser version)
      key: undefined
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
    startup: {
      // initial requests will have a stretch timeout
      requestTimeoutBeforeReady: 0.5,
      // if something fails because a timeout or a network error, retry at least
      retriesOnFailureBeforeReady: 1,
      // fires SDK_READY_TIMEOUT after this amount of seconds
      readyTimeout: 0
    }
  };

  const withDefaults = merge(init, custom);

  withDefaults.scheduler.featuresRefreshRate = fromSecondsToMillis(withDefaults.scheduler.featuresRefreshRate);
  withDefaults.scheduler.segmentsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.segmentsRefreshRate);
  withDefaults.scheduler.metricsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.metricsRefreshRate);
  withDefaults.scheduler.impressionsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.impressionsRefreshRate);
  withDefaults.startup.requestTimeoutBeforeReady = fromSecondsToMillis(withDefaults.startup.requestTimeoutBeforeReady);
  withDefaults.startup.readyTimeout = fromSecondsToMillis(withDefaults.startup.readyTimeout);

  return withDefaults;
}

const proto = {
  get(name) {
    switch (name) {
      case 'version':
        return 'javascript-5.2.0';
      case 'authorizationKey':
        return this.core.authorizationKey;
      case 'key':
        return this.core.key;
      case 'featuresRefreshRate':
        return this.scheduler.featuresRefreshRate;
      case 'segmentsRefreshRate':
        return this.scheduler.segmentsRefreshRate;
      case 'metricsRefreshRate':
        return this.scheduler.metricsRefreshRate;
      case 'impressionsRefreshRate':
        return this.scheduler.impressionsRefreshRate;
      default:
        return this[name];
    }
  },

  url(target) {
    if (eventsEndpointMatcher.test(target)) {
      return `${this.urls.events}${target}`;
    }

    return `${this.urls.sdk}${target}`;
  }
};

module.exports = function CreateSettings(settings) {
  return Object.assign(Object.create(proto), defaults(settings));
};
