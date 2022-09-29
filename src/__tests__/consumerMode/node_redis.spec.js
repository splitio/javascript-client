/* eslint-disable no-console */

import osFunction from 'os';
import ipFunction from 'ip';
import tape from 'tape';
import sinon from 'sinon';
import RedisServer from 'redis-server';
import RedisClient from 'ioredis';
import { exec } from 'child_process';
import { SplitFactory } from '../../index';
import { merge } from '../../utils/lang';
import KeyBuilder from '../../storage/Keys';
import SettingsFactory from '../../utils/settings';
import { nearlyEqual } from '../testUtils';

const IP_VALUE = ipFunction.address();
const HOSTNAME_VALUE = osFunction.hostname();
const NA = 'NA';

const redisPort = '6385';

const config = {
  core: {
    authorizationKey: 'SOME API KEY' // in consumer mode, api key is only used to identify the sdk instance
  },
  mode: 'consumer',
  storage: {
    type: 'REDIS',
    prefix: 'REDIS_NODE_UT',
    options: {
      url: `redis://localhost:${redisPort}/0`
    }
  },
  startup: {
    readyTimeout: 36000 // 10hs
  }
};

/**
 * Initialize redis server and run a cli bash command to load redis with data to do the proper tests
 */
const initializeRedisServer = () => {
  // Simply pass the port that you want a Redis server to listen on.
  const server = new RedisServer(redisPort);

  const promise = new Promise((resolve, reject) => {
    server
      .open()
      .then(() => {
        exec(`cat ./src/__tests__/mocks/redis-commands.txt | redis-cli -p ${redisPort}`, err => {
          if (err) {
            reject(server);
            // node couldn't execute the command
            return;
          }

          resolve(server);
        });
      });
  });

  return promise;
};

tape('NodeJS Redis', function (t) {

  t.test('Regular usage', assert => {
    initializeRedisServer()
      .then(async (server) => {
        const expectedConfig = '{"color":"brown"}';
        const sdk = SplitFactory(config);
        const client = sdk.client();

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT'), 'on', '`getTreatment` evaluation using Redis storage should be correct.');
        assert.equal((await client.getTreatmentWithConfig('other', 'UT_IN_SEGMENT')).treatment, 'off', '`getTreatmentWithConfig` evaluation using Redis storage should be correct.');

        assert.equal((await client.getTreatments('UT_Segment_member', ['UT_NOT_IN_SEGMENT']))['UT_NOT_IN_SEGMENT'], 'off', '`getTreatments` evaluation using Redis storage should be correct.');
        assert.equal((await client.getTreatmentsWithConfig('other', ['UT_NOT_IN_SEGMENT']))['UT_NOT_IN_SEGMENT'].treatment, 'on', '`getTreatmentsWithConfig` evaluation using Redis storage should be correct.');

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
          permissions: ['admin']
        }), 'on', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
          permissions: ['not_matching']
        }), 'off', 'Evaluations using Redis storage should be correct.');

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
          permissions: ['create']
        }), 'off', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
          permissions: ['not_matching']
        }), 'on', 'Evaluations using Redis storage should be correct.');
        assert.deepEqual(await client.getTreatmentWithConfig('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
          permissions: ['not_matching']
        }), {
          treatment: 'on',
          config: null
        }, 'Evaluations using Redis storage should be correct, including configs.');
        assert.deepEqual(await client.getTreatmentWithConfig('UT_Segment_member', 'always-o.n-with-config'), {
          treatment: 'o.n',
          config: expectedConfig
        }, 'Evaluations using Redis storage should be correct, including configs.');

        assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'on', 'Evaluations using Redis storage should be correct.');

        // Below splits were added manually to the redis_mock.json file.
        // They are all_keys (always evaluate to on) which depend from always-on split. the _on/off is what treatment they are expecting there.
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on'), 'on', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_off'), 'off', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on_negated'), 'off', 'Evaluations using Redis storage should be correct.');

        assert.equal(typeof client.track('nicolas@split.io', 'user', 'test.redis.event', 18).then, 'function', 'Track calls should always return a promise on Redis mode.');
        assert.equal(typeof client.track().then, 'function', 'Track calls should always return a promise on Redis mode, even when parameters are incorrect.');

        assert.true(await client.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'If the event was succesfully queued the promise will resolve to true');
        assert.false(await client.track(), 'If the event was NOT succesfully queued the promise will resolve to false');

        await client.ready(); // promise already resolved
        await client.destroy();

        // close server connection
        server.close().then(assert.end);
      });
  });

  t.test('Connection timeout and then ready', assert => {
    const readyTimeout = 0.1; // 100 millis
    const configWithShortTimeout = { ...config, startup: { readyTimeout } };
    const sdk = SplitFactory(configWithShortTimeout);
    const client = sdk.client();

    const start = Date.now();
    let readyTimestamp;
    let redisServer;
    assert.plan(19);

    client.getTreatment('UT_Segment_member', 'always-on').then(treatment => {
      assert.equal(treatment, 'on', 'Evaluations using Redis storage should be correct and resolved once Redis connection is stablished');
    });
    client.track('nicolas@split.io', 'user', 'test.redis.event', 18).then(result => {
      assert.true(result, 'If the event was succesfully queued the promise will resolve to true once Redis connection is stablished');
    });

    // SDK_READY_TIMED_OUT event must be emitted after 100 millis
    client.on(client.Event.SDK_READY_TIMED_OUT, () => {
      const delay = Date.now() - start;
      assert.true(nearlyEqual(delay, readyTimeout * 1000), 'SDK_READY_TIMED_OUT event must be emitted after 100 millis');
    });

    // Also, ready promise must be rejected after 100 millis
    client.ready().catch(() => {
      const delay = Date.now() - start;
      assert.true(nearlyEqual(delay, readyTimeout * 1000), 'Ready promise must be rejected after 100 millis');

      // initialize server to emit SDK_READY
      initializeRedisServer().then(async (server) => {
        readyTimestamp = Date.now();
        redisServer = server;
        try {
          await client.ready();
          assert.fail('Ready promise keeps being rejected until SDK_READY is emitted');
        } catch (error) {
          assert.pass('Ready promise keeps being rejected until SDK_READY is emitted');
        }
      });
    });

    // subscribe to SDK_READY event to assert regular usage
    client.on(client.Event.SDK_READY, async () => {
      const delay = Date.now() - readyTimestamp;
      assert.true(nearlyEqual(delay, 0, 100), 'SDK_READY event must be emitted soon once Redis server is connected');

      await client.ready();
      assert.pass('Ready promise is resolved once SDK_READY is emitted');

      // some asserts to test regular usage
      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');
      assert.equal(await client.getTreatment('other', 'UT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');
      assert.true(await client.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'If the event was succesfully queued the promise will resolve to true');
      assert.false(await client.track(), 'If the event was NOT succesfully queued the promise will resolve to false');

      await client.destroy();
      assert.pass();
    });

    // create a new factory with a very short readyTimedout config to emit SDK_READY_TIMED_OUT even with the Redis server on
    client.on(client.Event.SDK_READY, async () => {
      const configWithVeryShortTimeout = {
        ...config,
        startup: { readyTimeout: 0.001 },
        core: { authorizationKey: 'aaa4sb69bjv7d4d027f7ukkitd53ek6a9ai9' }
      };
      const sdk2 = SplitFactory(configWithVeryShortTimeout);
      const client2 = sdk2.client();
      client2.on(client2.Event.SDK_READY_TIMED_OUT, () => {
        assert.pass('SDK_READY_TIMED_OUT event must be emitted');
      });

      client2.on(client2.Event.SDK_READY, async () => {
        assert.pass('SDK_READY event must be emitted');

        // some asserts to test regular usage
        assert.equal(await client2.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client2.getTreatment('other', 'UT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');
        assert.true(await client2.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'If the event was succesfully queued the promise will resolve to true');
        assert.false(await client2.track(), 'If the event was NOT succesfully queued the promise will resolve to false');

        await client2.destroy();

        // close server connection
        redisServer.close().then(() => {
          assert.pass();
          assert.end();
        });
      });
    });

  });

  t.test('Connection error', assert => {
    initializeRedisServer()
      .then((server) => {
        const sdk = SplitFactory(config);
        const client = sdk.client();

        client.once(client.Event.SDK_READY_TIMED_OUT, assert.fail);
        client.ready().then(assert.pass).catch(assert.fail);

        const start = Date.now();
        client.once(client.Event.SDK_READY, async () => { // Use SDK_READY event.
          // ready promise is resolved
          await client.ready();
          const delay = Date.now() - start;
          assert.true(nearlyEqual(delay, 0), 'Ready promise is resolved once SDK_READY is emitted, and it is emitted almost immediately after the SDK is created');

          assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
            permissions: ['create']
          }), 'off', 'Control assertion - Everything working as expected.');
          assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
            permissions: ['not_matching']
          }), 'on', 'Control assertion - Everything working as expected.');
          assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'on', 'Control assertion - Everything working as expected.');

          assert.true(await client.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'Control assertion - Everything working as expected.');

          assert.notEqual(await client.track(), 'Control assertion - Everything working as expected.');

          // close server connection
          server.close().then(() => {
            // we need to add a delay before doing a getTreatment
            setTimeout(async () => {
              assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
                permissions: ['create']
              }), 'control', 'In the event of a Redis error like a disconnection, getTreatments should not hang but resolve to "control".');
              assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
                permissions: ['not_matching']
              }), 'control', 'In the event of a Redis error like a disconnection, getTreatments should not hang but resolve to "control".');
              assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'control', 'In the event of a Redis error like a disconnection, getTreatments should not hang but resolve to "control".');

              assert.false(await client.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'In the event of a Redis error like a disconnection, track should resolve to false.');

              await client.destroy();

              assert.end();
            }, 1000);
          });
        });
      });
  });

  t.test('Calling destroy with pending operations', assert => {
    initializeRedisServer()
      .then(async (server) => {
        const sdk = SplitFactory({
          ...config,
          debug: 'WARN' // we want to see the error/warning logs calling the actual log method (if there's any)
        });
        const client = sdk.client();

        try {
          await client.ready(); // Validate ready promise.
        } catch (e) {
          assert.fail(e);
        }

        process.on('unhandledRejection', assert.fail);
        process.on('uncaughtException', assert.fail);

        sinon.spy(console, 'log');

        await client.getTreatment('Tito_the_skeleton', 'always-on');
        client.destroy();

        setTimeout(() => {
          process.off('unhandledRejection', assert.fail);
          process.off('uncaughtException', assert.fail);
          assert.pass('Check unhandledRejection or uncaughtException detected. None is expected');

          assert.false(console.log.calledWithMatch('threw or exceeded configured timeout of 5000ms setting. Message: Error: Stream isn\'t writeable and enableOfflineQueue options is false'), 'No error should have been triggered from Redis.');
          console.log.restore();

          // close server connection and wrap up.
          server.close().then(assert.end);
        }, 2000);
      });
  });

  t.test('Check IP and Hostname in Redis', assert => {
    initializeRedisServer()
      .then(async (server) => {

        const configs = [
          config,
          merge({}, config, { core: { IPAddressesEnabled: true } }),
          merge({}, config, { core: { IPAddressesEnabled: false } })
        ];

        for (let config of configs) {

          // Redis client and keys required to check Redis store.
          const setting = SettingsFactory(config);
          const connection = new RedisClient(setting.storage.options.url);
          const keys = new KeyBuilder(setting);
          const eventKey = keys.buildEventsKey();
          const impressionsKey = keys.buildImpressionsKey();

          // Clean up list of events and impressions.
          connection.del(eventKey);
          connection.del(impressionsKey);

          // Init Split client for current config
          const sdk = SplitFactory(config);
          const client = sdk.client();

          // Perform client actions to store a single event and impression objects into Redis
          await client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT');
          await client.track('nicolas@split.io', 'user', 'test.redis.event', 18);

          // Assert if the impression object was stored properly
          let redisImpressions = await connection.lrange(impressionsKey, 0, -1);
          assert.equal(redisImpressions.length, 1, 'After getting a treatment, we should have one impression on Redis.');
          const parsedImpression = JSON.parse(redisImpressions[0]);
          assert.equal(parsedImpression.m.i, setting.core.IPAddressesEnabled ? IP_VALUE : NA, `If IPAddressesEnabled is true, the property .m.i of the impression object must be equal to the machine ip, or "${NA}" otherwise.`);
          assert.equal(parsedImpression.m.n, setting.core.IPAddressesEnabled ? HOSTNAME_VALUE : NA, `If IPAddressesEnabled is true, the property .m.n of the impression object must be equal to the machine hostname, or "${NA}" otherwise.`);

          // Assert if the event object was stored properly
          let redisEvents = await connection.lrange(eventKey, 0, -1);
          assert.equal(redisEvents.length, 1, 'After tracking an event, we should have one event on Redis.');
          const parsedEvent = JSON.parse(redisEvents[0]);
          assert.equal(parsedEvent.m.i, setting.core.IPAddressesEnabled ? IP_VALUE : NA, `If IPAddressesEnabled is true, the property .m.i of the event object must be equal to the machine ip, or "${NA}" otherwise.`);
          assert.equal(parsedEvent.m.n, setting.core.IPAddressesEnabled ? HOSTNAME_VALUE : NA, `If IPAddressesEnabled is true, the property .m.n of the event object must be equal to the machine hostname, or "${NA}" otherwise.`);

          // Deallocate Split and Redis clients
          await client.destroy();
          await connection.quit();
        }

        // close server connection
        server.close().then(assert.end);
      });
  });
});
