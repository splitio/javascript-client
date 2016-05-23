'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

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

var tape = require('tape');
var SplitsStorage = require('../../../../lib/storage/splits');

var SplitFactory = require('@splitsoftware/splitio-engine').parse;

var s1 = SplitFactory(require('./mocks/01.split'));
var s2 = SplitFactory(require('./mocks/02.split'));
var s3 = SplitFactory(require('./mocks/03.split'));
var mergedSegments = new _set2.default([].concat((0, _toConsumableArray3.default)(s1.getSegments()), (0, _toConsumableArray3.default)(s2.getSegments()), (0, _toConsumableArray3.default)(s3.getSegments())));

tape('SPLITS STORAGE / should return a list of unique segment names', function (assert) {
  var storage = new SplitsStorage();

  storage.update([s1, s2, s3]);

  var allMustBePresent = true;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(storage.getSegments()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var segment = _step.value;

      allMustBePresent = allMustBePresent && mergedSegments.has(segment);
    }

    // RangeError: Maximum call stack size exceeded.
    // assert.deepEqual(storage.getSegments(), mergedSegments, 'all the segment names should be included');
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

  assert.true(allMustBePresent, 'all the segment names should be included');
  assert.end();
});

tape('SPLITS STORAGE / get by split name', function (assert) {
  var storage = new SplitsStorage();

  storage.update([s1, s2, s3]);

  assert.equal(storage.get('sample_01'), s1, 'should be the same object');
  assert.equal(storage.get('sample_02'), s2, 'should be the same object');
  assert.equal(storage.get('sample_03'), s3, 'should be the same object');
  assert.end();
});