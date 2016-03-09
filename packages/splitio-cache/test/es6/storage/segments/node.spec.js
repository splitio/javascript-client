const tape = require('tape');
const SegmentsStorage = require('../../../../lib/storage/segments');

tape('SEGMENTS STORAGE', assert => {
  const storage = new SegmentsStorage;

  const segmentName = 's';
  const segmentSet = new Set(['a', 'b', 'c']);

  storage.update(segmentName, segmentSet);

  assert.equal(storage.get(segmentName), segmentSet, 'should use the same instance');
  assert.end();
});
