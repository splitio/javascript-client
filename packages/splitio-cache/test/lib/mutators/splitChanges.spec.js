'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var tape = require('tape');
var splitChangesMutatorFactory = require('../../../lib/mutators/splitChanges');
var splitChangesMock = require('./mocks/splitChanges');

tape('Split Changes', function (assert) {
  var splitsStorage = new Map();
  function storageMutator(splitsArray) {
    splitsArray.forEach(function (s) {
      splitsStorage.set(s.getKey(), s);
    });
  }

  var mutator = splitChangesMutatorFactory(splitChangesMock);
  mutator(storageMutator);

  assert.deepEqual([].concat(_toConsumableArray(splitsStorage.keys())), ['sample_feature', 'demo_feature', 'hello_world'], 'split keys should match with split names');
  assert.end();
});
//# sourceMappingURL=splitChanges.spec.js.map