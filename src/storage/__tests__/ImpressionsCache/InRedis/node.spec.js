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

const ImpressionsCacheInRedis = require('../../../ImpressionsCache/InRedis');

const SettingsFactory = require('../../../../utils/settings');
const settings = SettingsFactory({
  storage: {
    type: 'REDIS'
  }
});

tape('IMPRESSIONS CACHE IN REDIS / should incrementally store values', async function(assert) {
  const connection = new Redis(settings.storage.options);
  const c = new ImpressionsCacheInRedis(settings, connection);

  const o1 = {
    feature: 'test1',
    key: 'facundo@split.io',
    treatment: 'on',
    time: Date.now(),
    changeNumber: 1
  };

  const o2 = {
    feature: 'test2',
    key: 'pepep@split.io',
    treatment: 'A',
    time: Date.now(),
    bucketingKey: '1234-5678',
    label: 'is in segment',
    changeNumber: 1
  };

  const o3 = {
    feature: 'test3',
    key: 'pipiip@split.io',
    treatment: 'B',
    time: Date.now(),
    changeNumber: 1
  };

  await c.clear();

  await c.track(o1);
  await c.track(o2);
  await c.track(o3);

  const state = await c.state();

  assert.true(find(state, o1));
  assert.true(find(state, o2));
  assert.true(find(state, o3));

  connection.quit();
  assert.end();
});
