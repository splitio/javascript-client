// @flow

'use strict';

const Redis = require('ioredis');
const tape = require('tape-catch');
const SplitCacheInRedis = require('../../../SplitCache/InRedis');
const KeyBuilder = require('../../../Keys');
const SettingsFactory = require('../../../../utils/settings');

const settings = SettingsFactory({
  storage: {
    type: 'REDIS'
  }
});

tape('SPLIT CACHE / Redis', async function (assert) {
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new SplitCacheInRedis(keys, connection);

  await cache.flush();

  await cache.addSplits([
    ['lol1','something'],
    ['lol2', 'something else']
  ]);

  let values = await cache.getAll();

  assert.ok( values.indexOf('something') !== -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  let splitNames = await cache.getKeys();

  assert.ok( splitNames.indexOf('lol1') !== -1 );
  assert.ok( splitNames.indexOf('lol2') !== -1 );

  await cache.removeSplit('lol1');

  values = await cache.getAll();

  assert.ok( values.indexOf('something') === -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  assert.ok( await cache.getSplit('lol1') == null );
  assert.ok( await cache.getSplit('lol2') === 'something else' );

  await cache.setChangeNumber(123);
  assert.ok( await cache.getChangeNumber() === 123 );

  splitNames = await cache.getKeys();

  assert.ok( splitNames.indexOf('lol1') === -1 );
  assert.ok( splitNames.indexOf('lol2') !== -1 );

  connection.quit();
  assert.end();
});
