// @flow

'use strict';

const tape = require('tape-catch');
const SegmentCache = require('../../../SegmentCache/InLocalStorage');

tape('SEGMENT CACHE IN MEMORY / suite', assert => {
  const cache = new SegmentCache();

  cache.addToSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === true );

  cache.removeFromSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === false );

  assert.end();
});
