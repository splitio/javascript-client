// @flow

'use strict';

const Redis = require('ioredis');
const tape = require('tape-catch');
const SplitCacheInRedis = require('../../../SplitCache/InRedis');

tape('SPLIT CACHE / Redis', async function (assert) {
  const r = new Redis(32768, 'localhost', {
      dropBufferSupport: true
  });
  const cache = new SplitCacheInRedis(r);

  await cache.flush();

  await cache.addSplits(['lol1', 'lol2'], ['something', 'something else']);

  let values = await cache.getAll();

  assert.ok( values.indexOf('something') !== -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  await cache.removeSplit('lol1');

  values = await cache.getAll();

  assert.ok( values.indexOf('something') === -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  assert.ok( await cache.getSplit('lol1') == null );
  assert.ok( await cache.getSplit('lol2') === 'something else' );

  await cache.setChangeNumber(123);
  assert.ok( await cache.getChangeNumber() === 123 );

  r.quit();
  assert.end();
});
