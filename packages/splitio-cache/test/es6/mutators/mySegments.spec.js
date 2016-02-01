'use strict';

let tape = require('tape');
let mySegmentsMutatorFactory = require('../../../lib/mutators/mySegments');

tape('Segment mutator', assert => {

  let segments = ['segment1', 'segment2'];

  let segmentsStorage;
  function storageMutator(segmentSet) {
    segmentsStorage = segmentSet;
  }

  let mutator = mySegmentsMutatorFactory(segments);
  mutator(storageMutator);

  assert.deepEqual([...segmentsStorage], segments, 'once mutator called data should be the same as the originally provided');
  assert.end();
});
