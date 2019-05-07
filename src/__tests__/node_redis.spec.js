/* eslint-disable no-console */

import tape from 'tape';
import sinon from 'sinon';
import RedisServer from 'redis-server';
import { exec } from 'child_process';
import { SplitFactory } from '../';

const redisPort = '6385';

const config = {
  core: {
    authorizationKey: 'uoj4sb69bjv7d4d027f7ukkitd53ek6a9ai9'
  },
  urls: {
    sdk: 'https://sdk-aws-staging.split.io/api',
    events: 'https://events-aws-staging.split.io/api'
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

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('other', 'UT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('other', 'UT_NOT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');

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
        assert.deepEqual(await client.getTreatmentWithConfig('UT_Segment_member', 'always-on-with-config'), {
          treatment: 'on',
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

        await client.destroy();

        // close server connection
        server.close().then(assert.end);
      });
  });

  t.test('Connection error', assert => {
    initializeRedisServer()
      .then((server) => {
        const sdk = SplitFactory(config);
        const client = sdk.client();

        client.once(client.Event.SDK_READY_TIMED_OUT, assert.fail);

        client.once(client.Event.SDK_READY, async () => { // Use SDK_READY event.
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
});
