'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

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

var tape = require('tape');
var segmentChangesMutatorFactory = require('../../../lib/mutators/segmentChanges');

tape('Segment Changes', function (assert) {
  var segmentChanges = {
    name: 'test-segment',
    added: ['a', 'b', 'c'],
    removed: ['d', 'e', 'f']
  };

  var segmentsStorage = new _map2.default().set('test-segment', new _set2.default(['d', 'e', 'f']));
  function storageMutator(segmentName, segmentSet) {
    segmentsStorage.set(segmentName, segmentSet);
  }
  function storageAccesor(segmentName) {
    return segmentsStorage.get(segmentName);
  }

  var mutator = segmentChangesMutatorFactory([segmentChanges]);
  mutator(storageAccesor, storageMutator);

  assert.deepEqual([].concat((0, _toConsumableArray3.default)(storageAccesor('test-segment'))), segmentChanges.added, 'We should only have [a, b, c]');
  assert.end();
});