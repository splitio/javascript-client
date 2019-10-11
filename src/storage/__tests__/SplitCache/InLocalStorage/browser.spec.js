import tape from 'tape-catch';
import SplitCacheInLocalStorage from '../../../SplitCache/InLocalStorage';
import KeyBuilder from '../../../Keys';
import SettingsFactory from '../../../../utils/settings';

tape('SPLIT CACHE / LocalStorage', assert => {
  const cache = new SplitCacheInLocalStorage(new KeyBuilder(SettingsFactory()));

  cache.flush();

  cache.addSplit('lol1', 'something');
  cache.addSplit('lol2', 'something else');

  let values = cache.getAll();

  assert.ok( values.indexOf('something') !== -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  cache.removeSplit('lol1');

  const splits = cache.fetchMany(['lol1', 'lol2']);
  assert.true(splits.get('lol1') === null);
  assert.true(splits.get('lol2') === 'something else');

  values = cache.getAll();

  assert.ok( values.indexOf('something') === -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  assert.ok( cache.getSplit('lol1') == null );
  assert.ok( cache.getSplit('lol2') === 'something else' );

  assert.ok( cache.getChangeNumber() === -1 );

  cache.setChangeNumber(123);
  assert.ok( cache.getChangeNumber() === 123 );

  assert.end();
});

tape('SPLIT CACHE / LocalStorage / Get Keys', assert => {
  const cache = new SplitCacheInLocalStorage(new KeyBuilder(SettingsFactory()));

  cache.addSplit('lol1', 'something');
  cache.addSplit('lol2', 'something else');

  let keys = cache.getKeys();

  assert.true(keys.indexOf('lol1') !== -1);
  assert.true(keys.indexOf('lol2') !== -1);
  assert.end();
});

tape('SPLIT CACHE / LocalStorage / Add Splits', assert => {
  const cache = new SplitCacheInLocalStorage(new KeyBuilder(SettingsFactory()));

  cache.addSplits([
    ['lol1', 'something'],
    ['lol2', 'something else']
  ]);

  cache.removeSplits(['lol1', 'lol2']);

  assert.true(cache.getSplit('lol1') == null);
  assert.true(cache.getSplit('lol2') == null);
  assert.end();
});

tape('SPLIT CACHE / LocalStorage / trafficTypeExists and ttcache tests', assert => {
  const cache = new SplitCacheInLocalStorage(new KeyBuilder(SettingsFactory()));

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
