// @flow

'use strict';

const tape = require('tape-catch');
const Redis = require('ioredis');

const splitObject: SplitObject = require('./mocks/input');
const splitView: SplitView = require('./mocks/output');

const Manager = require('../');
const SplitCacheInRedis = require('../../storage/SplitCache/InRedis');

const KeyBuilder = require('../../storage/Keys');

const SettingsFactory = require('../../utils/settings');
const settings = SettingsFactory({
  storage: {
    type: 'REDIS'
  }
});

tape('MANAGER API / In Redis', async function(assert) {
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new SplitCacheInRedis(keys, connection);
  const manager = new Manager(cache);

  await cache.flush();

  await cache.addSplit( splitObject.name, JSON.stringify(splitObject) );

  const views = await manager.splits();

  assert.deepEqual( views[0] , splitView );

  connection.quit();
  assert.end();
});
