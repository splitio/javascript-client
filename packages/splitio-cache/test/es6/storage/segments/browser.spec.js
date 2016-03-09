const tape = require('tape');
const SegmentsStorage = require('../../../../lib/storage/segments');

tape('SEGMENTS STORAGE', assert => {
  const storage = new SegmentsStorage;
  const segments = new Set(['a', 'b', 'c']);

  storage.update(segments);

  assert.true(storage.has('b'), 'b is present in the list of segment names');
  assert.false(storage.has('s'), 's is present in the list of segment names');
  assert.end();
});
