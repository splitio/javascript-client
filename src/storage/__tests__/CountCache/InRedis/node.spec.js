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
const tape = require('tape');

const KeyBuilder = require('../../../Keys');
const CountCacheInRedis = require('../../../CountCache/InRedis');

const SettingsFactory = require('../../../../utils/settings');
const settings = SettingsFactory({
  storage: {
    type: 'REDIS'
  }
});

tape('COUNT CACHE IN REDIS / cover basic behavior', async function(assert) {
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new CountCacheInRedis(keys, connection);
  let state;

  await cache.clear();

  await cache.track('counted-metric-one');
  await cache.track('counted-metric-one');

  state = await cache.state();

  assert.equal(state['counted-metric-one'], 2);

  await cache.track('counted-metric-two');

  state = await cache.state();

  assert.equal(state['counted-metric-one'], 2);
  assert.equal(state['counted-metric-two'], 1);

  connection.quit();
  assert.end();
});
