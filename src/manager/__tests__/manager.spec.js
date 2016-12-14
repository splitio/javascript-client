// @flow

'use strict';

const tape = require('tape-catch');
const splitObject : SplitObject = require('./splitChanges.mock');
const splitView : FormattedSplit = require('./manager.expected');

const Manager = require('../');
const SplitCache = require('../../storage/SplitCache/InMemory');

tape('Manager API', assert => {
  const cache = new SplitCache();
  const manager = new Manager(cache);

  cache.addSplit( splitObject.name, JSON.stringify(splitObject) );

  assert.deepEqual( manager.splits()[0] , splitView );
  assert.end();
});
