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
  }
};
*/
var eventsEndpointMatcher = /\/(testImpressions|metrics)/;

function defaults(custom /*: Settings */) /*: Settings */{
  var init = {
    core: {
      authorizationKey: undefined, // API token (tight to an environment)
      key: undefined // user key in your system (only required for browser version).
    },
    scheduler: {
      featuresRefreshRate: 30, // 30 sec
      segmentsRefreshRate: 60, // 60 sec
      metricsRefreshRate: 60, // 60 sec
      impressionsRefreshRate: 60 // 60 sec
    },
    urls: {
      sdk: 'https://sdk.split.io/api',
      events: 'https://events.split.io/api'
    }
  };

  var final = (0, _assign2.default)({}, init, custom);

  // we can't start the engine without the authorization token.

  if (typeof final.core.authorizationKey !== 'string') {
    throw Error('Please provide an authorization token to startup the engine');
  }

  // override invalid values with default ones

  if (typeof final.scheduler.featuresRefreshRate !== 'number') {
    final.scheduler.featuresRefreshRate = init.scheduler.featuresRefreshRate;
  }

  if (typeof final.scheduler.segmentsRefreshRate !== 'number') {
    final.scheduler.segmentsRefreshRate = init.scheduler.segmentsRefreshRate;
  }

  if (typeof final.scheduler.metricsRefreshRate !== 'number') {
    final.scheduler.metricsRefreshRate = init.scheduler.metricsRefreshRate;
  }

  if (typeof final.scheduler.impressionsRefreshRate !== 'number') {
    final.scheduler.impressionsRefreshRate = init.scheduler.impressionsRefreshRate;
  }

  // return an object with all the magic on it

  return final;
}

var proto = {
  get: function get(name) {
    switch (name) {
      case 'version':
        return 'javascript-5.1.0';
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
