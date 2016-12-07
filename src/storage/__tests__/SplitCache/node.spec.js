// @flow

'use strict';

const tape = require('tape');
const SplitCacheInMemory = require('../../SplitCacheInMemory');
const SplitCacheInRedis = require('../../SplitCacheInRedis');

tape('SPLIT CACHE IN MEMORY / suite', assert => {
  const cache = new SplitCacheInMemory();

  cache.addSplit('lol1', 'something');
  cache.addSplit('lol2', 'something else');

  let values = [...cache.getAll()];

  assert.ok( values.indexOf('something') !== -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  cache.removeSplit('lol1');

  values = [...cache.getAll()];

  assert.ok( values.indexOf('something') === -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  assert.ok( cache.getSplit('lol1') === undefined );
  assert.ok( cache.getSplit('lol2') === 'something else' );

  cache.setChangeNumber(123);
  assert.ok( cache.getChangeNumber() === 123 );

  assert.end();
});

tape('SPLIT CACHE IN REDIS / suite', async function (assert) {
  const cache = new SplitCacheInRedis();

  await Promise.all([
    cache.addSplit('lol1', 'something'),
    cache.addSplit('lol2', 'something else')
  ]);

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

  assert.end();
});
