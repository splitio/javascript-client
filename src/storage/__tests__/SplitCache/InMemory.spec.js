import tape from 'tape-catch';
import SplitCacheInMemory from '../../SplitCache/InMemory';

tape('SPLIT CACHE / In Memory', assert => {
  const cache = new SplitCacheInMemory();

  cache.addSplit('lol1', '{ "name": "something"}');
  cache.addSplit('lol2', '{ "name": "something else"}');

  let values = cache.getAll();

  assert.ok( values.indexOf('{ "name": "something"}') !== -1 );
  assert.ok( values.indexOf('{ "name": "something else"}') !== -1 );

  cache.removeSplit('lol1');

  values = cache.getAll();

  assert.ok( values.indexOf('{ "name": "something"}') === -1 );
  assert.ok( values.indexOf('{ "name": "something else"}') !== -1 );

  assert.ok( cache.getSplit('lol1') == null );
  assert.ok( cache.getSplit('lol2') === '{ "name": "something else"}' );

  cache.setChangeNumber(123);
  assert.ok( cache.getChangeNumber() === 123 );

  assert.end();
});

tape('SPLIT CACHE / In Memory / Get Keys', assert => {
  const cache = new SplitCacheInMemory();

  cache.addSplit('lol1', '{ "name": "something"}');
  cache.addSplit('lol2', '{ "name": "something else"}');

  let keys = cache.getKeys();

  assert.true(keys.indexOf('lol1') !== -1);
  assert.true(keys.indexOf('lol2') !== -1);
  assert.end();
});

tape('SPLIT CACHE / In Memory / trafficTypeExists and ttcache tests', assert => {
  const cache = new SplitCacheInMemory();

  cache.addSplits([ // loop of addSplit
    ['split1', '{ "trafficTypeName": "user_tt" }'],
    ['split2', '{ "trafficTypeName": "account_tt" }'],
    ['split3', '{ "trafficTypeName": "user_tt" }'],
    ['malformed', '{}']
  ]);
  cache.addSplit('split4', '{ "trafficTypeName": "user_tt" }');

  assert.true(cache.trafficTypeExists('user_tt'));
  assert.true(cache.trafficTypeExists('account_tt'));
  assert.false(cache.trafficTypeExists('not_existent_tt'));

  cache.removeSplit('split4');

  assert.true(cache.trafficTypeExists('user_tt'));
  assert.true(cache.trafficTypeExists('account_tt'));

  cache.removeSplits(['split3', 'split2']); // it'll invoke a loop of removeSplit

  assert.true(cache.trafficTypeExists('user_tt'));
  assert.false(cache.trafficTypeExists('account_tt'));

  cache.removeSplit('split1');

  assert.false(cache.trafficTypeExists('user_tt'));
  assert.false(cache.trafficTypeExists('account_tt'));

  cache.addSplit('split1', '{ "trafficTypeName": "user_tt" }');
  assert.true(cache.trafficTypeExists('user_tt'));

  cache.addSplit('split1', '{ "trafficTypeName": "account_tt" }');
  assert.true(cache.trafficTypeExists('account_tt'));
  assert.false(cache.trafficTypeExists('user_tt'));

  assert.end();
});
