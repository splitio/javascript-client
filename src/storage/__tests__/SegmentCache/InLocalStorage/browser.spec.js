// @flow

'use strict';

const tape = require('tape-catch');
const SegmentCacheInLocalStorage = require('../../../SegmentCache/InLocalStorage');

const KeyBuilder = require('../../../Keys');
const SettingsFactory = require('../../../../utils/settings');

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
