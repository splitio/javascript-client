'use strict';

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var segmentChangesService = require('@splitsoftware/splitio-services/lib/segmentChanges'); /**
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

var segmentChangesRequest = require('@splitsoftware/splitio-services/lib/segmentChanges/get');

var segmentMutatorFactory = require('../mutators/segmentChanges');
var cache = new _map2.default();

function cacheKeyGenerator(authorizationKey, segmentName) {
  return authorizationKey + '/segmentChanges/' + segmentName;
}

function segmentChangesDataSource(_ref) {
  var authorizationKey = _ref.authorizationKey;
  var segmentName = _ref.segmentName;

  var cacheKey = cacheKeyGenerator(authorizationKey, segmentName);
  var since = cache.get(cacheKey) || -1;

  return segmentChangesService(segmentChangesRequest({
    since: since,
    segmentName: segmentName
  })).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var since = json.since;
    var till = json.till;
    var data = (0, _objectWithoutProperties3.default)(json, ['since', 'till']);


    cache.set(cacheKey, till);

    return segmentMutatorFactory(data);
  }).catch(function () {/* noop */});
}

module.exports = segmentChangesDataSource;
//# sourceMappingURL=segmentChanges.js.map