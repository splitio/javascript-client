'use strict';

const tape = require('tape');
const SegmentCacheInMemory = require('../../../SegmentCache/InMemory');

const KeyBuilder = require('../../../Keys');
const SettingsFactory = require('../../../../utils/settings');

tape('SEGMENT CACHE / in memory', assert => {
  const cache = new SegmentCacheInMemory(new KeyBuilder(SettingsFactory()));

  cache.addToSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === true );

  cache.removeFromSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === false );

  assert.end();
});
