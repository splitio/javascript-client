'use strict';

let tape = require('tape');
let segmentChangesMutatorFactory = require('../../../lib/mutators/segmentChanges');

tape('Segment Changes', assert => {
  let segmentChanges = {
    name: 'test-segment',
    added: ['a', 'b', 'c'],
    removed: ['d', 'e', 'f']
  };

  let segmentsStorage = new Map().set('test-segment', new Set(['d', 'e', 'f']));
  function storageMutator(segmentName, segmentSet) {
    segmentsStorage.set(segmentName, segmentSet);
  }
  function storageAccesor(segmentName) {
    return segmentsStorage.get(segmentName);
  }

  let mutator = segmentChangesMutatorFactory(segmentChanges);
  mutator(storageAccesor, storageMutator);

  assert.deepEqual(
    [...storageAccesor('test-segment')],
    segmentChanges.added,
    'We should only have [a, b, c]'
  );
  assert.end();
});
