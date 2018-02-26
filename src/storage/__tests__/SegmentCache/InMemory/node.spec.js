import tape from 'tape-catch';
import SegmentCacheInMemory from '../../../SegmentCache/InMemory';
import KeyBuilder from '../../../Keys';
import SettingsFactory from '../../../../utils/settings';

tape('SEGMENT CACHE / in memory', assert => {
  const cache = new SegmentCacheInMemory(new KeyBuilder(SettingsFactory()));

  cache.addToSegment('mocked-segment', [
    'a', 'b', 'c'
  ]);

  cache.setChangeNumber('mocked-segment', 1);

  cache.removeFromSegment('mocked-segment', [
    'd'
  ]);

  assert.ok( cache.getChangeNumber('mocked-segment') === 1 );

  cache.addToSegment('mocked-segment', [
    'd', 'e'
  ]);

  cache.removeFromSegment('mocked-segment', [
    'a', 'c'
  ]);

  assert.ok( cache.getChangeNumber('mocked-segment') === 1 );

  assert.ok( cache.isInSegment('mocked-segment', 'a') === false );
  assert.ok( cache.isInSegment('mocked-segment', 'b') === true );
  assert.ok( cache.isInSegment('mocked-segment', 'c') === false );
  assert.ok( cache.isInSegment('mocked-segment', 'd') === true );
  assert.ok( cache.isInSegment('mocked-segment', 'e') === true );

  assert.end();
});