'use strict';

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
var merge = require('lodash/merge');
var defaultsPerPlatform = require('./defaults');

var eventsEndpointMatcher = /\/(testImpressions|metrics)/;

function fromSecondsToMillis(n) {
  return Math.round(n * 1000);
}

function defaults(custom /*: Settings */) /*: Settings */{
  var init = {
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
    }
  };

  var withDefaults = merge(init, defaultsPerPlatform, custom);

  withDefaults.scheduler.featuresRefreshRate = fromSecondsToMillis(withDefaults.scheduler.featuresRefreshRate);
  withDefaults.scheduler.segmentsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.segmentsRefreshRate);
  withDefaults.scheduler.metricsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.metricsRefreshRate);
  withDefaults.scheduler.impressionsRefreshRate = fromSecondsToMillis(withDefaults.scheduler.impressionsRefreshRate);
  withDefaults.startup.requestTimeoutBeforeReady = fromSecondsToMillis(withDefaults.startup.requestTimeoutBeforeReady);
  withDefaults.startup.readyTimeout = fromSecondsToMillis(withDefaults.startup.readyTimeout);

  return withDefaults;
}

var proto = {
  get: function get(name) {
    switch (name) {
      case 'version':
        return 'javascript-6.0.0-canary.1';
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
  url: function url(target) {
    if (eventsEndpointMatcher.test(target)) {
      return '' + this.urls.events + target;
    }

    return '' + this.urls.sdk + target;
  }
};

module.exports = function CreateSettings(settings) {
  return (0, _assign2.default)((0, _create2.default)(proto), defaults(settings));
};