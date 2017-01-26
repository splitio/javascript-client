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
const find = require('lodash/find');

const MetricsCacheInRedis = require('../../../MetricsCache/InRedis');

const SettingsFactory = require('../../../../utils/settings');
const settings = SettingsFactory({
  storage: {
    type: 'REDIS'
  }
});

tape('METRICS CACHE IN REDIS / Given a value it should increment by one the correct bucket', async function(assert) {
  const connection = new Redis(settings.storage.options);
  const cache = new MetricsCacheInRedis(settings, connection);
  let state;

  await cache.clear();

  await cache.track(1);
  state = await cache.state();

  assert.true(state[0] === 1, 'the bucket #0 should have 1');

  await cache.track(1.5);
  state = await cache.state();
  assert.true(state[1] === 1, 'the bucket #1 should have 1');

  await cache.track(2.25);
  state = await cache.state();
  assert.true(state[2] === 1, 'the bucket #3 should have 1');

  await cache.track(985251);
  state = await cache.state();
  assert.true(state[22] === 1, 'the bucket #22 should have 1');

  connection.quit();
  assert.end();
});
