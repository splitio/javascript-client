'use strict';

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
var SegmentsStorage = require('../../../../lib/storage/segments');

tape('SEGMENTS STORAGE / get(string) should retrieve the Set which represents the segment requested', function (assert) {
  var storage = new SegmentsStorage();

  var segmentName = 's';
  var segmentSet = new _set2.default(['a', 'b', 'c']);

  storage.update(segmentName, segmentSet);

  assert.equal(storage.get(segmentName), segmentSet, 'should be the same Set instance');
  assert.end();
});

tape('SEGMENTS STORAGE / .size property should represent the amount of segments stored', function (assert) {
  var storage = new SegmentsStorage();
  var segmentName = 'mock';
  var segment = new _set2.default(['a', 'b', 'c', 'd', 'e']);

  storage.update(segmentName, segment);

  assert.equal(storage.size, 1, 'we should have 1 segment stored');
  assert.end();
});