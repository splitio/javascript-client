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

tape('SEGMENT CACHE IN Redis / register segments', async function (assert) {
  const r = new Redis(32768, 'localhost', {
      dropBufferSupport: true
  });
  const cache = new SegmentCache(r);

  await cache.flush();

  await cache.registerSegment('s1');
  await cache.registerSegment('s2');
  await cache.registerSegments(['s2', 's3', 's4']);

  const segments = await cache.getRegisteredSegments();

  ['s1', 's2', 's3', 's4'].forEach(s => assert.ok(segments.includes(s)));

  r.quit();

  assert.end();
});
