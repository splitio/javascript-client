// @flow

'use strict';

const tape = require('tape-catch');
const SplitCacheInMemory = require('../../SplitCache/InMemory');

tape('SPLIT CACHE / In Memory', assert => {
  const cache = new SplitCacheInMemory();

  cache.addSplit('lol1', 'something');
  cache.addSplit('lol2', 'something else');

  let values = cache.getAll();

  assert.ok( values.indexOf('something') !== -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  cache.removeSplit('lol1');

  values = cache.getAll();

  assert.ok( values.indexOf('something') === -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  assert.ok( cache.getSplit('lol1') == null );
  assert.ok( cache.getSplit('lol2') === 'something else' );

  cache.setChangeNumber(123);
  assert.ok( cache.getChangeNumber() === 123 );

  assert.end();
});

tape('SPLIT CACHE / In Memory / Get Keys', assert => {
  const cache = new SplitCacheInMemory();

  cache.addSplit('lol1', 'something');
  cache.addSplit('lol2', 'something else');

  let keys = cache.getKeys();

  assert.true(keys.includes('lol1'));
  assert.true(keys.includes('lol2'));
  assert.end();
});
