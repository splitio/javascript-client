// @flow

'use strict';

const Redis = require('ioredis');
const tape = require('tape-catch');
const SegmentCache = require('../../../SegmentCache/InRedis');

tape('SEGMENT CACHE IN Redis / suite', async function (assert) {
  const r = new Redis(32768, 'localhost', {
      dropBufferSupport: true
  });
  const cache = new SegmentCache(r);

  await cache.flush();

  await cache.addToSegment('mocked-segment', [
    'a', 'b', 'c'
  ]);

  await cache.setChangeNumber('mocked-segment', 1);

  await cache.removeFromSegment('mocked-segment', [
    'd'
  ]);

  assert.ok( await cache.getChangeNumber('mocked-segment') === 1 );

  await cache.addToSegment('mocked-segment', [
    'd', 'e'
  ]);

  await cache.removeFromSegment('mocked-segment', [
    'a', 'c'
  ]);

  assert.ok( await cache.getChangeNumber('mocked-segment') === 1 );

  assert.ok( await cache.isInSegment('mocked-segment', 'a') === false );
  assert.ok( await cache.isInSegment('mocked-segment', 'b') === true );
  assert.ok( await cache.isInSegment('mocked-segment', 'c') === false );
  assert.ok( await cache.isInSegment('mocked-segment', 'd') === true );
  assert.ok( await cache.isInSegment('mocked-segment', 'e') === true );

  r.quit();
  assert.end();
});
