'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

var storage = require('../storage');
var splitsStorage = storage.splits;
var segmentsStorage = storage.segments;
var getSegment = segmentsStorage.get.bind(segmentsStorage);
var updateSegment = segmentsStorage.update.bind(segmentsStorage);

var pool = require('./pool');

function segmentChangesUpdater() {
  log('Updating segmentChanges');

  return new _promise2.default(function (resolve /*, reject*/) {
    // Read the list of available segments.
    var segments = splitsStorage.getSegments();

    var toBeProcessed = segments.size;
    var processed = 0;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      var _loop = function _loop() {
        var segmentName = _step.value;

        pool.acquire(function (err, resource) {

          segmentChangesDataSource(segmentName).then(function (mutator) {
            pool.release(resource);

            log('completed download of ' + segmentName);

            if (typeof mutator === 'function') {
              mutator(getSegment, updateSegment);
            }

            log('completed mutations for ' + segmentName);

            processed++;
            if (processed === toBeProcessed) {
              resolve(storage);
            }
          });
        });
      };

      for (var _iterator = (0, _getIterator3.default)(segments), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        _loop();
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
  }).then(function (storage) {
    pool.destroyAllNow();

    return storage;
  });
}

module.exports = segmentChangesUpdater;
//# sourceMappingURL=segmentChanges.js.map