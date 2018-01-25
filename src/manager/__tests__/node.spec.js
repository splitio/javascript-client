'use strict';

import tape from 'tape-catch';
import Redis from 'ioredis';
import splitObject from './mocks/input';
import splitView from './mocks/output';
import Manager from '../';
import SplitCacheInRedis from '../../storage/SplitCache/InRedis';
import KeyBuilder from '../../storage/Keys';
import SettingsFactory from '../../utils/settings';
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