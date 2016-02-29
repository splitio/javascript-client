const tape = require('tape');
const SplitsStorage = require('../../../../lib/storage/splits');

const SplitFactory = require('@splitsoftware/splitio-engine').parse;

const s1 = SplitFactory(require('./mocks/01.split'));
const s2 = SplitFactory(require('./mocks/02.split'));
const s3 = SplitFactory(require('./mocks/03.split'));
const mergedSegments = new Set(
  [...s1.getSegments()],
  [...s2.getSegments()],
  [...s3.getSegments()]
);

tape('SPLITS STORAGE / should return a list of unique segment names', assert => {
  const storage = new SplitsStorage;

  storage.update([s1, s2, s3]);

  assert.deepEqual(storage.getSegments(), mergedSegments, 'should be the same segment names');
  assert.end();
});

tape('SPLITS STORAGE / get by split name', assert => {
  const storage = new SplitsStorage;

  storage.update([s1, s2, s3]);

  assert.equal(storage.get('sample_01'), s1, 'should be the same object');
  assert.equal(storage.get('sample_02'), s2, 'should be the same object');
  assert.equal(storage.get('sample_03'), s3, 'should be the same object');
  assert.end();
});
