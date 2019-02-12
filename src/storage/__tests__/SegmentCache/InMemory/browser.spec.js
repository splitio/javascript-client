import tape from 'tape-catch';
import SegmentCacheInMemory from '../../../SegmentCache/InMemory';
import KeyBuilder from '../../../Keys';
import SettingsFactory from '../../../../utils/settings';

tape('SEGMENT CACHE / in memory', assert => {
  const cache = new SegmentCacheInMemory(new KeyBuilder(SettingsFactory()));

  cache.addToSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === true );

  cache.removeFromSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === false );

  assert.end();
});
