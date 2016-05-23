'use strict';

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

var tape = require('tape');
var splitChangesMutatorFactory = require('../../../lib/mutators/splitChanges');
var splitChangesMock = require('./mocks/splitChanges');

tape('Split Changes', function (assert) {
  var splitsStorage = new _map2.default();
  function storageMutator(splitsArray) {
    splitsArray.forEach(function (s) {
      splitsStorage.set(s.getKey(), s);
    });
  }

  var mutator = splitChangesMutatorFactory(splitChangesMock);
  mutator(splitsStorage, storageMutator);

  assert.deepEqual([].concat((0, _toConsumableArray3.default)(splitsStorage.keys())), ['sample_feature', 'demo_feature', 'hello_world'], 'split keys should match with split names');
  assert.end();
});