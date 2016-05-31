'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

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
var log = require('debug')('splitio-cache:updater');
var segmentChangesDataSource = require('../ds/segmentChanges');

module.exports = function SegmentChangesUpdater(settings, hub, storage) {
  var sinceValuesCache = new _map2.default();

  return function updateSegments() {
    log('Updating segmentChanges');

    var downloads = [].concat((0, _toConsumableArray3.default)(storage.splits.getSegments())).map(function (segmentName) {
      return segmentChangesDataSource(settings, segmentName, sinceValuesCache).then(function (mutator) {
        log('completed download of ' + segmentName);

        if (mutator !== undefined) {
          mutator(storage);

          log('completed mutations for ' + segmentName);
        } else {
          log('none changes to be made to ' + segmentName);
        }
      });
    });

    return _promise2.default.all(downloads).then(function () {
      return hub.emit(hub.Event.SDK_UPDATE, storage);
    }).catch(function (error) {
      return hub.emit(hub.Event.SDK_UPDATE_ERROR, error);
    });
  };
};