'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

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
var log = require('debug')('splitio-engine:matcher');

/**
 * White list Matcher Factory.
 */
function whitelistMatcherContext(whitelist /*: Set */) /*: Function */{
  return function whitelistMatcher(key /*: string */) /*: boolean */{
    var isInWhitelist = whitelist.has(key);

    log('[whitelistMatcher] evaluated key ' + key + ' in [' + [].concat((0, _toConsumableArray3.default)(whitelist)).join(',') + '] => ' + isInWhitelist);

    return isInWhitelist;
  };
}

module.exports = whitelistMatcherContext;
//# sourceMappingURL=whitelist.js.map