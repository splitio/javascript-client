// @flow

'use strict';

const tape = require('tape-catch');

const splitObject: SplitObject = require('./mocks/input');
const splitView: SplitView = require('./mocks/output');

const Manager = require('../');
const SplitCacheInMemory = require('../../storage/SplitCache/InMemory');

tape('MANAGER API / In Memory / List all splits', async function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache);

  cache.addSplit( splitObject.name, JSON.stringify(splitObject) );

  const views = manager.splits();

  assert.deepEqual( views[0] , splitView );
  assert.end();
});

tape('MANAGER API / In Memory / Read only one split by name', async function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache);

  cache.addSplit(splitObject.name, JSON.stringify(splitObject));

  const split = manager.split(splitObject.name);

  assert.deepEqual(split, splitView);
  assert.end();
});

tape('MANAGER API / In Memory / List all the split names', async function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache);

  cache.addSplit(splitObject.name, JSON.stringify(splitObject));

  const names = manager.names(splitObject.name);

  assert.true(names.indexOf(splitObject.name) !== -1);
  assert.end();
});
