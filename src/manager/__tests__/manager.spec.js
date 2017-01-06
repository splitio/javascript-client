// @flow

'use strict';

const tape = require('tape-catch');

const splitObject: SplitObject = require('./mocks/input');
const splitView: SplitView = require('./mocks/output');

const Manager = require('../');
const SplitCacheInMemory = require('../../storage/SplitCache/InMemory');

tape('MANAGER API / In Memory', async function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache);

  cache.addSplit( splitObject.name, JSON.stringify(splitObject) );

  const views = await manager.splits();

  assert.deepEqual( views[0] , splitView );
  assert.end();
});

tape('MANAGER API / In Memory', async function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache);

  cache.addSplit(splitObject.name, JSON.stringify(splitObject));

  const split = await manager.split(splitObject.name);

  assert.deepEqual(split, splitView);
  assert.end();
});
