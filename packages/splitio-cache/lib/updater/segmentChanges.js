'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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
  var segmentsAreReady = new _map2.default();
  var startingUp = true;

  return function updateSegments() {
    log('Updating segmentChanges');

    var downloads = [].concat((0, _toConsumableArray3.default)(storage.splits.getSegments())).map(function (segmentName) {
      // register segments for future check if they are ready or not
      if (startingUp) {
        if (segmentsAreReady.get(segmentName) === undefined) {
          segmentsAreReady.set(segmentName, false);
        }
      }

      return segmentChangesDataSource(settings, segmentName, sinceValuesCache).then(function (_ref) {
        var shouldUpdate = _ref.shouldUpdate;
        var isFullUpdate = _ref.isFullUpdate;
        var mutator = _ref.mutator;

        log('completed download of ' + segmentName);

        // apply mutations
        mutator(storage);

        // register segment data as ready if required
        if (startingUp && segmentsAreReady.get(segmentName) === false && isFullUpdate) {
          segmentsAreReady.set(segmentName, true);
        }

        // did we apply an update?
        return shouldUpdate;
      });
    });

    return _promise2.default.all(downloads).then(function (shouldUpdates) {
      // if at least one segment was updated
      var shouldUpdate = shouldUpdates.indexOf(true) !== -1;

      // check if everything was correctly downloaded only required on start up
      if (startingUp) {
        var ready = true;

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _getIterator3.default)(segmentsAreReady.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var v = _step.value;

            ready = ready && v;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        if (ready) {
          startingUp = false;
          segmentsAreReady = null;
          hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED);
        }
      }
      // should we notificate an update?
      else {
          shouldUpdate && hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED);
        }

      return shouldUpdate;
    });
  };
};