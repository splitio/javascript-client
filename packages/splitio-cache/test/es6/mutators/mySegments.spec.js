const tape = require('tape');

const SegmentsStorage = require('../../../lib/storage/segments/browser');
const MySegmentsMutatorFactory = require('../../../lib/mutators/mySegments');

tape('Segment mutator', assert => {
  const segments = ['segment1', 'segment2'];
  const storage = new SegmentsStorage;
  const mutator = MySegmentsMutatorFactory(segments);

  mutator(storage.update.bind(storage));

  for (const segmentName of segments) {
    assert.true(storage.has(segmentName), 'segment should be present in the storage');
  }

  assert.end();
});
