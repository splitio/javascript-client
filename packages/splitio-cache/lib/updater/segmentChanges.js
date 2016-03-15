'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = require('debug')('splitio-cache:updater'); /**
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

var segmentChangesDataSource = require('../ds/segmentChanges');

var storage = require('../storage');
var segmentsStorage = storage.segments;
var get = segmentsStorage.get.bind(segmentsStorage);
var update = segmentsStorage.update.bind(segmentsStorage);

function segmentChangesUpdater(_ref) {
  var authorizationKey = _ref.authorizationKey;

  log('[' + authorizationKey + '] Updating segmentChanges');

  // Read the list of segments available.
  var segments = storage.splits.getSegments();

  // Per each segment, request the changes and mutate the storage accordingly.
  return _promise2.default.all([].concat((0, _toConsumableArray3.default)(segments)).map(function (segmentName) {
    return segmentChangesDataSource({ authorizationKey: authorizationKey, segmentName: segmentName });
  })).then(function (segmentsMutators) {
    segmentsMutators.forEach(function (mutator) {
      return mutator(get, update);
    });
  }).then(function () {
    return storage;
  });
}

module.exports = segmentChangesUpdater;
//# sourceMappingURL=segmentChanges.js.map