// @flow

'use strict';

const tape = require('tape-catch');
const SegmentCacheInMemory = require('../../../SegmentCache/InMemory');

tape('SEGMENT CACHE / in memory', assert => {
  const cache = new SegmentCacheInMemory();

  cache.addToSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === true );

  cache.removeFromSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === false );

  assert.end();
});
