/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
import Redis from 'ioredis';
import tape from 'tape';
import KeyBuilder from '../../../Keys';
import CountCacheInRedis from '../../../CountCache/InRedis';
import SettingsFactory from '../../../../utils/settings';
const settings = SettingsFactory({
  storage: {
    type: 'REDIS',
    prefix: 'count_cache_UT'
  }
});

tape('COUNT CACHE IN REDIS / cover basic behavior', async function(assert) {
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new CountCacheInRedis(keys, connection);

  assert.true(cache.isEmpty(), 'isEmpty always returns true, just there to respect the interface.');
  assert.notEqual(typeof cache.clear, 'undefined', 'Clear method should be there to respect interface.');

  await cache.track('counted-metric-one');
  await cache.track('counted-metric-one');

  const keyOne = keys.buildCountKey('counted-metric-one');
  const keyTwo = keys.buildCountKey('counted-metric-two');

  let metricOneValue = await connection.get(keyOne);
  assert.equal(metricOneValue, '2');

  await cache.track('counted-metric-two');

  metricOneValue = await connection.get(keyOne);
  let metricTwoValue = await connection.get(keyTwo);

  assert.equal(metricOneValue, '2');
  assert.equal(metricTwoValue, '1');

  assert.true(cache.isEmpty(), 'isEmpty always returns true, just there to respect the interface.');

  // Clean up
  const keysToClean = await connection.keys('count_cache_UT.*');
  if (keysToClean.length) await connection.del(keysToClean);

  connection.quit();
  assert.end();
});
