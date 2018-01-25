'use strict';

import tape from 'tape';
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