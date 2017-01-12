// @flow

'use strict';

const tape = require('tape-catch');
const SegmentCacheInLocalStorage = require('../../../SegmentCache/InLocalStorage');

tape('SEGMENT CACHE / in LocalStorage', assert => {
  const cache = new SegmentCacheInLocalStorage();

  cache.flush();

  cache.addToSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === true );

  cache.removeFromSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === false );

  assert.end();
});
