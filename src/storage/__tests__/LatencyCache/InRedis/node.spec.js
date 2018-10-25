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
import tape from 'tape-catch';
import KeyBuilder from '../../../Keys';
import LatencyCacheInRedis from '../../../LatencyCache/InRedis';
import SettingsFactory from '../../../../utils/settings';
const settings = SettingsFactory({
  storage: {
    type: 'REDIS',
    prefix: 'latency_cache_UT'
  }
});

tape('METRICS CACHE IN REDIS / should count based on ranges', async function (assert) {
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new LatencyCacheInRedis(keys, connection);
  const metricName = 'testing';

  assert.true(cache.isEmpty(), 'Is empty always returns true, just there to respect the interface.');
  assert.notEqual(typeof cache.clear, 'undefined', 'Clear method should be there to respect interface.');

  await cache.track(metricName, 1);
  await cache.track(metricName, 1.2);
  await cache.track(metricName, 1.4);

  assert.equal(await connection.get(keys.buildLatencyKey(metricName, 0)), '3', 'the bucket #0 should have 3');

  await cache.track(metricName, 1.5);

  assert.equal(await connection.get(keys.buildLatencyKey(metricName, 1)), '1', 'the bucket #1 should have 1');

  await cache.track(metricName, 2.25);
  await cache.track(metricName, 2.26);
  await cache.track(metricName, 2.265);

  assert.equal(await connection.get(keys.buildLatencyKey(metricName, 2)), '3', 'the bucket #2 should have 3');

  await cache.track(metricName, 985251);

  assert.true(cache.isEmpty(), 'Is empty always returns true, just there to respect the interface.');

  assert.equal(await connection.get(keys.buildLatencyKey(metricName, 22)), '1', 'the bucket #22 should have 1');

  // Clean up post-test
  const keysToClean = await connection.keys('latency_cache_UT.*');
  await connection.del(keysToClean);

  connection.quit();
  assert.end();
});
