import Redis from 'ioredis';
import tape from 'tape-catch';
import SplitCacheInRedis from '../../../SplitCache/InRedis';
import KeyBuilder from '../../../Keys';
import SettingsFactory from '../../../../utils/settings';

tape('SPLIT CACHE / Redis', async function (assert) {
  const settings = SettingsFactory({
    storage: { type: 'REDIS' }
  });
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new SplitCacheInRedis(keys, connection);

  await cache.flush();

  await cache.addSplits([
    ['lol1','something'],
    ['lol2', 'something else']
  ]);

  let values = await cache.getAll();

  assert.ok( values.indexOf('something') !== -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  let splitNames = await cache.getKeys();

  assert.ok( splitNames.indexOf('lol1') !== -1 );
  assert.ok( splitNames.indexOf('lol2') !== -1 );

  await cache.removeSplit('lol1');

  values = await cache.getAll();

  assert.ok( values.indexOf('something') === -1 );
  assert.ok( values.indexOf('something else') !== -1 );

  assert.ok( await cache.getSplit('lol1') == null );
  assert.ok( await cache.getSplit('lol2') === 'something else' );

  await cache.setChangeNumber(123);
  assert.ok( await cache.getChangeNumber() === 123 );

  splitNames = await cache.getKeys();

  assert.ok( splitNames.indexOf('lol1') === -1 );
  assert.ok( splitNames.indexOf('lol2') !== -1 );

  const splits = await cache.fetchMany(['lol1', 'lol2']);
  assert.ok( splits.get('lol1') === null );
  assert.ok( splits.get('lol2') === 'something else' );

  connection.quit();
  assert.end();
});

tape('SPLIT CACHE / Redis / trafficTypeExists tests', async function(assert) {
  const prefix = 'redis_cache_ut_prefix';
  const settings = SettingsFactory({
    storage: {
      type: 'REDIS',
      prefix
    }
  });
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new SplitCacheInRedis(keys, connection);

  const testTTName = 'tt_test_name';
  const testTTNameNoCount = 'tt_test_name_2';
  const testTTNameInvalid = 'tt_test_name_3';
  const ttKey = keys.buildTrafficTypeKey(testTTName);
  const ttKeyNoCount = keys.buildTrafficTypeKey(testTTNameNoCount);
  const ttKeyInvalid = keys.buildTrafficTypeKey(testTTNameInvalid);

  await cache.flush();

  await connection.set(ttKey, 3);
  await connection.set(ttKeyNoCount, 0);
  await connection.set(ttKeyInvalid, 'NaN');

  assert.true(await cache.trafficTypeExists(testTTName));
  assert.false(await cache.trafficTypeExists(testTTNameNoCount));
  assert.false(await cache.trafficTypeExists(ttKeyInvalid));
  assert.false(await cache.trafficTypeExists('not_existent_tt'));

  await connection.del(ttKey);
  await connection.del(ttKeyNoCount);
  await connection.del(ttKeyInvalid);

  connection.quit();
  assert.end();
});
