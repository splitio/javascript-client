'use strict';

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
var MutatorFactory = require('../../../lib/mutators/splitChanges');
var splitChangesMock = require('./mocks/splitChanges');
var SplitsStorage = require('../../../lib/storage/splits');

tape('Split Changes', function (assert) {
  var splits = new SplitsStorage();

  var mutator = MutatorFactory(splitChangesMock);
  mutator({ splits: splits });

  var _arr = ['sample_feature', 'demo_feature', 'hello_world'];
  for (var _i = 0; _i < _arr.length; _i++) {
    var feature = _arr[_i];
    assert.true(splits.get(feature) !== undefined, 'split keys should match with split names');
  }
  assert.end();
});