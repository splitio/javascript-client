// @flow

'use strict';

const tape = require('tape-catch');
const SegmentCacheInMemory = require('../../../SegmentCache/InMemory');

tape('SEGMENT CACHE IN MEMORY / suite', assert => {
  const cache = new SegmentCacheInMemory();

  cache.addToSegment('mocked-segment', 'optional');

  assert.ok( cache.isInSegment('mocked-segment', 'optional') === true );

  cache.removeFromSegment('mocked-segment', 'optional');

  assert.ok( cache.isInSegment('mocked-segment', 'optional') === false );

  assert.end();
});
