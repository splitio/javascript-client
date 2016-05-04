'use strict';

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
    }
  };
*/
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
    // NodeJS specific settings
    node: {
      http: {
        poolSize: 6
      }
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

var settings = void 0;

module.exports = {
  configure: function configure(params) {
    settings = defaults(params);

    return this;
  },
  get: function get(settingName) {
    if (settings === undefined) {
      throw Error('Asked for configurations before they were defined');
    }

    switch (settingName) {
      case 'version':
        return 'javascript-4.0.1';
      case 'authorizationKey':
        return settings.core.authorizationKey;
      case 'key':
        return settings.core.key;
      case 'featuresRefreshRate':
        return settings.scheduler.featuresRefreshRate;
      case 'segmentsRefreshRate':
        return settings.scheduler.segmentsRefreshRate;
      case 'metricsRefreshRate':
        return settings.scheduler.metricsRefreshRate;
      case 'impressionsRefreshRate':
        return settings.scheduler.impressionsRefreshRate;
      default:
        return settings[settingName];
    }
  }
};
//# sourceMappingURL=index.js.map