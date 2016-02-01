'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var tape = require('tape');
var segmentChangesMutatorFactory = require('../../../lib/mutators/segmentChanges');

tape('Segment Changes', function (assert) {
  var segmentChanges = {
    name: 'test-segment',
    added: ['a', 'b', 'c'],
    removed: ['d', 'e', 'f']
  };

  var segmentsStorage = new Map().set('test-segment', new Set(['d', 'e', 'f']));
  function storageMutator(segmentName, segmentSet) {
    segmentsStorage.set(segmentName, segmentSet);
  }
  function storageAccesor(segmentName) {
    return segmentsStorage.get(segmentName);
  }

  var mutator = segmentChangesMutatorFactory(segmentChanges);
  mutator(storageAccesor, storageMutator);

  assert.deepEqual([].concat(_toConsumableArray(storageAccesor('test-segment'))), segmentChanges.added, 'We should only have [a, b, c]');
  assert.end();
});
//# sourceMappingURL=segmentChanges.spec.js.map