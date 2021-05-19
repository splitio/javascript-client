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
import Redis from '../../../RedisAdapter';
import tape from 'tape-catch';
import sinon from 'sinon';
import KeyBuilder from '../../../Keys';
import ImpressionsCacheInRedis from '../../../ImpressionsCache/InRedis';
import SettingsFactory from '../../../../utils/settings';

tape('IMPRESSIONS CACHE IN REDIS / should incrementally store values', async function(assert) {
  const settings = SettingsFactory({
    storage: {
      type: 'REDIS',
      prefix: 'ut_impr_cache'
    }
  });
  const impressionsKey = 'ut_impr_cache.SPLITIO.impressions';
  const testMeta = { thisIsTheMeta: true };
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const c = new ImpressionsCacheInRedis(keys, connection, testMeta);

  const o1 = {
    feature: 'test1',
    keyName: 'facundo@split.io',
    treatment: 'on',
    time: Date.now(),
    changeNumber: 1
  };

  const o2 = {
    feature: 'test2',
    keyName: 'pepep@split.io',
    treatment: 'A',
    time: Date.now(),
    bucketingKey: '1234-5678',
    label: 'is in segment',
    changeNumber: 1
  };

  const o3 = {
    feature: 'test3',
    keyName: 'pipiip@split.io',
    treatment: 'B',
    time: Date.now(),
    changeNumber: 1
  };

  // cleanup
  await connection.del(impressionsKey);

  await c.track([o1]);
  await c.track([o2, o3]);
  const state = await connection.lrange(impressionsKey, 0, -1);
  // This is testing both the track and the _toJSON method.
  assert.deepEqual(state[0], JSON.stringify({
    m: testMeta,
    i: { k: o1.keyName, f: o1.feature, t: o1.treatment, c: o1.changeNumber, m: o1.time }
  }));
  assert.deepEqual(state[1], JSON.stringify({
    m: testMeta,
    i: { k: o2.keyName, b: o2.bucketingKey, f: o2.feature, t: o2.treatment, r: o2.label,c: o2.changeNumber, m: o2.time }
  }));
  assert.deepEqual(state[2], JSON.stringify({
    m: testMeta,
    i: { k: o3.keyName, f: o3.feature, t: o3.treatment, c: o3.changeNumber, m: o3.time }
  }));

  await connection.del(impressionsKey);
  await connection.quit();
  assert.end();
});

tape('IMPRESSIONS CACHE IN REDIS / should not resolve track before calling expire', async function(assert) {
  const impressionsKey = 'ut_impr_cache_2.SPLITIO.impressions';
  const settings = SettingsFactory({
    storage: {
      type: 'REDIS',
      prefix: 'ut_impr_cache_2'
    }
  });
  const testMeta = { thisIsTheMeta: true };
  const redis = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const c = new ImpressionsCacheInRedis(keys, redis, testMeta);

  const i1 = { feature: 'test4', keyName: 'nicolas@split.io', treatment: 'off', time: Date.now(), changeNumber: 1 };
  const i2 = { feature: 'test5', keyName: 'matias@split.io', treatment: 'on', time: Date.now(), changeNumber: 2 };

  const spy1 = sinon.spy(redis, 'rpush');
  const spy2 = sinon.spy(redis, 'expire');

  // Crap so we can reproduce the latency as we would have on a remote server.
  const originalExpire = redis.expire;
  redis.expire = function patchedForTestRedisExpire() {
    return new Promise((res, rej) => {
      setTimeout(() => {
        originalExpire.apply(redis, arguments).then(res).catch(rej);
      }, 150); // 150ms of delay on the expire
    });
  };

  // cleanup prior to test.
  await redis.del(impressionsKey);

  c.track([i1, i2]).then(() => {
    redis.quit(); // Try to disconnect right away.
    assert.ok(spy1.called, 'Redis rpush was called once before executing external callback.');
    // Following assertion fails if the expire takes place after disconnected and throws unhandledPromiseRejection
    assert.ok(spy2.called, 'Redis expire was called once before executing external callback.');
  }).catch(e => {
    assert.fail(`An error was generated from the redis expire tests: ${e}`);
  }).then(async () => {
    // Finally clean up and wrap up.
    spy1.restore();
    spy2.restore();
    assert.end();
  });
});
