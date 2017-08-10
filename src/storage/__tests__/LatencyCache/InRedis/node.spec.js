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
'use strict';

const Redis = require('ioredis');
const tape = require('tape-catch');

const KeyBuilder = require('../../../Keys');
const LatencyCacheInRedis = require('../../../LatencyCache/InRedis');

const SettingsFactory = require('../../../../utils/settings');
const settings = SettingsFactory({
  storage: {
    type: 'REDIS'
  }
});

tape('METRICS CACHE IN REDIS / should count based on ranges', async function (assert) {
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new LatencyCacheInRedis(keys, connection);
  const metricName = 'testing';
  let state;

  await cache.clear();

  await cache.track(metricName, 1);
  await cache.track(metricName, 1.2);
  await cache.track(metricName, 1.4);
  state = await cache.state();

  assert.true(state[metricName][0] === 3, 'the bucket #0 should have 3');

  await cache.track(metricName, 1.5);
  state = await cache.state();

  assert.true(state[metricName][1] === 1, 'the bucket #1 should have 1');

  await cache.track(metricName, 2.25);
  await cache.track(metricName, 2.26);
  await cache.track(metricName, 2.265);
  state = await cache.state();

  assert.true(state[metricName][2] === 3, 'the bucket #3 should have 1');

  await cache.track(metricName, 985251);
  state = await cache.state();

  assert.true(state[metricName][22] === 1, 'the bucket #22 should have 1');

  connection.quit();
  assert.end();
});

tape('METRICS CACHE IN REDIS / clear', async function (assert) {
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new LatencyCacheInRedis(keys, connection);
  const metricName = 'testing';

  await Promise.all([
    cache.track(metricName, 1),
    cache.track(metricName, 1000)
  ]);

  await cache.clear();

  let isEmpty = await cache.isEmpty();

  assert.true(isEmpty, 'after call clear, the cache should be empty');

  connection.quit();
  assert.end();
});
