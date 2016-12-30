// @flow

'use strict';

const tape = require('tape-catch');
const Redis = require('ioredis');

const splitObject: SplitObject = require('./mocks/input');
const splitView: FormattedSplit = require('./mocks/output');

const Manager = require('../');
const SplitCacheInRedis = require('../../storage/SplitCache/InRedis');

tape('MANAGER API / In Redis', async function(assert) {
  const r = new Redis(32768, 'localhost', {
    dropBufferSupport: true
  });
  const cache = new SplitCacheInRedis(r);
  const manager = new Manager(cache);

  await cache.flush();

  await cache.addSplit( splitObject.name, JSON.stringify(splitObject) );

  const views = await manager.splits();

  assert.deepEqual( views[0] , splitView );

  r.quit();
  assert.end();
});
