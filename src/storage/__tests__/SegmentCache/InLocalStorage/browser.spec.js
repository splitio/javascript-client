'use strict';

import tape from 'tape-catch';
import SegmentCacheInLocalStorage from '../../../SegmentCache/InLocalStorage';
import KeyBuilder from '../../../Keys';
import SettingsFactory from '../../../../utils/settings';

const settings = SettingsFactory({});

tape('SEGMENT CACHE / in LocalStorage', assert => {
  const keys = new KeyBuilder(settings);
  const cache = new SegmentCacheInLocalStorage(keys);

  cache.flush();

  cache.addToSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === true );

  cache.removeFromSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === false );

  assert.end();
});