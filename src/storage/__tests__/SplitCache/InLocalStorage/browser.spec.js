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

  const splits = cache.getSplits(['lol1', 'lol2']);
  assert.true(splits['lol1'] === null);
  assert.true(splits['lol2'] === 'something else');

  values = cache.getAll();

  assert.ok( values.indexOf('something') === -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  assert.ok( cache.getSplit('lol1') == null );
  assert.ok( cache.getSplit('lol2') === 'something else' );

  assert.false( cache.checkCache(), 'checkCache should return false until localstorage has data.' );

  assert.ok( cache.getChangeNumber() === -1 );

  assert.false( cache.checkCache(), 'checkCache should return false until localstorage has data.' );

  cache.setChangeNumber(123);

  assert.true( cache.checkCache(), 'checkCache should return true once localstorage has data.' );

  assert.ok( cache.getChangeNumber() === 123 );

  assert.end();
});

tape('SPLIT CACHE / LocalStorage / Get Keys', assert => {
  const cache = new SplitCacheInLocalStorage(new KeyBuilder(SettingsFactory()));

  cache.addSplit('lol1', 'something');
  cache.addSplit('lol2', 'something else');

  let keys = cache.getSplitNames();

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

tape('SPLIT CACHE / LocalStorage / killLocally', assert => {
  const cache = new SplitCacheInLocalStorage(new KeyBuilder(SettingsFactory()));
  cache.addSplit('lol1', '{ "name": "something"}');
  cache.addSplit('lol2', '{ "name": "something else"}');
  const initialChangeNumber = cache.getChangeNumber();

  // kill an non-existent split
  cache.killLocally('nonexistent_split', 'other_treatment', 101).then((updated) => {
    const nonexistentSplit = cache.getSplit('nonexistent_split');

    assert.equal(updated, false, 'killLocally resolves without update if split doesn\'t exist');
    assert.equal(nonexistentSplit, undefined, 'non-existent split keeps being non-existent');
  });

  // kill an existent split
  cache.killLocally('lol1', 'some_treatment', 100).then((updated) => {
    let lol1Split = JSON.parse(cache.getSplit('lol1'));

    assert.equal(updated, true, 'killLocally resolves with update if split is changed');
    assert.true(lol1Split.killed, 'existing split must be killed');
    assert.equal(lol1Split.defaultTreatment, 'some_treatment', 'existing split must have new default treatment');
    assert.equal(lol1Split.changeNumber, 100, 'existing split must have the given change number');
    assert.equal(cache.getChangeNumber(), initialChangeNumber, 'cache changeNumber is not changed');

    // not update if changeNumber is old
    cache.killLocally('lol1', 'some_treatment_2', 90).then((updated) => {
      lol1Split = JSON.parse(cache.getSplit('lol1'));

      assert.equal(updated, false, 'killLocally resolves without update if changeNumber is old');
      assert.notEqual(lol1Split.defaultTreatment, 'some_treatment_2', 'existing split is not updated if given changeNumber is older');

      assert.end();
    });
  });
});