/* eslint-disable no-console */

import osFunction from 'os';
import ipFunction from '../../utils/ip';
import tape from 'tape';
import sinon from 'sinon';
import RedisServer from 'redis-server';
import RedisClient from 'ioredis';
import { exec } from 'child_process';
import { SplitFactory } from '../../';
import { merge } from '@splitsoftware/splitio-commons/src/utils/lang';
import { KeyBuilderSS } from '@splitsoftware/splitio-commons/src/storages/KeyBuilderSS';
import { validatePrefix } from '@splitsoftware/splitio-commons/src/storages/KeyBuilder';
import { settingsFactory } from '../../settings/node';
import { nearlyEqual } from '../testUtils';
import { version } from '../../../package.json';
import { OPTIMIZED, NONE, DEBUG } from '@splitsoftware/splitio-commons/src/utils/constants';
import { truncateTimeFrame } from '@splitsoftware/splitio-commons/src/utils/time';

const IP_VALUE = ipFunction.address();
const HOSTNAME_VALUE = osFunction.hostname();
const NA = 'NA';

const redisPort = '6385';

const TOTAL_RAW_IMPRESSIONS = 16;
const TOTAL_EVENTS = 2;
const DEDUPED_IMPRESSIONS = 3;

const config = {
  core: {
    authorizationKey: 'SOME SDK KEY' // in consumer mode, SDK key is only used to track and log warning regarding duplicated SDK instances
  },
  mode: 'consumer',
  storage: {
    type: 'REDIS',
    prefix: 'REDIS_NODE_UT',
    options: {
      url: `redis://localhost:${redisPort}/0`
    }
  },
  sync: {
    impressionsMode: 'DEBUG'
  },
  startup: {
    readyTimeout: 36000 // 10hs
  }
};
const expectedConfig = '{"color":"brown"}';
const timeFrame = Date.now();
const expectedImpressionCount = [
  `UT_IN_SEGMENT::${truncateTimeFrame(timeFrame)}`, '2',
  `UT_NOT_IN_SEGMENT::${truncateTimeFrame(timeFrame)}`, '2',
  `UT_SET_MATCHER::${truncateTimeFrame(timeFrame)}`, '2',
  `UT_NOT_SET_MATCHER::${truncateTimeFrame(timeFrame)}`, '3',
  `always-o.n-with-config::${truncateTimeFrame(timeFrame)}`, '1',
  `always-on::${truncateTimeFrame(timeFrame)}`, '1',
  `hierarchical_splits_testing_on::${truncateTimeFrame(timeFrame)}`, '1',
  `hierarchical_splits_testing_off::${truncateTimeFrame(timeFrame)}`, '1',
  `hierarchical_splits_testing_on_negated::${truncateTimeFrame(timeFrame)}`, '1',
];

const expectedSplitName = 'hierarchical_splits_testing_on';
const expectedSplitView = { name: 'hierarchical_splits_testing_on', trafficType: 'user', killed: false, changeNumber: 1487277320548, treatments: ['on', 'off'], configs: {}, sets: [], defaultTreatment: 'off' };

const MOCKS = {
  '': 'redis-commands',
  'flag_sets': 'redis-commands-flag-sets'
};

/**
 * Initialize redis server and run a cli bash command to load redis with data to do the proper tests
 */
const initializeRedisServer = (mock = '') => {
  // Simply pass the port that you want a Redis server to listen on.
  const server = new RedisServer(redisPort);
  const mockFileName = MOCKS[mock];

  const promise = new Promise((resolve, reject) => {
    server
      .open()
      .then(() => {
        exec(`cat ./src/__tests__/mocks/${mockFileName}.txt | redis-cli -p ${redisPort}`, err => {
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

  t.test('Regular usage - DEBUG strategy', assert => {
    initializeRedisServer()
      .then(async (server) => {
        const sdk = SplitFactory(config);
        const client = sdk.client();
        const manager = sdk.manager();

        /** Evaluation, track and manager methods before SDK_READY */
        client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT').then(result => assert.equal(result, 'control', 'Evaluations using Redis storage should be control until connection is stablished.'));
        client.getTreatment('other', 'UT_IN_SEGMENT').then(result => assert.equal(result, 'control', 'Evaluations using Redis storage should be control until connection is stablished.'));

        manager.names().then((result) => assert.deepEqual(result, [], 'manager `names` method returns an empty list of split names if called before SDK_READY or Redis operation fail'));
        manager.split(expectedSplitName).then((result) => assert.deepEqual(result, null, 'manager `split` method returns a null split view if called before SDK_READY or Redis operation fail'));
        manager.splits().then((result) => assert.deepEqual(result, [], 'manager `splits` method returns an empty list of split views if called before SDK_READY or Redis operation fail'));

        client.track('nicolas@split.io', 'user', 'before.ready', 18).then((result) => assert.true(result, 'Redis adapter queue "rpush" operations until it is ready.'));

        await client.ready();

        /** Evaluation, track and manager methods on SDK_READY */

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

        assert.equal(typeof client.track().then, 'function', 'Track calls should always return a promise on Redis mode, even when parameters are incorrect.');

        assert.true(await client.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'If the event was successfully queued the promise will resolve to true');
        assert.false(await client.track(), 'If the event was NOT successfully queued the promise will resolve to false');

        // Manager methods
        const splitNames = await manager.names();
        assert.equal(splitNames.length, 25, 'manager `names` method returns the list of split names asynchronously');
        assert.equal(splitNames.indexOf(expectedSplitName) > -1, true, 'list of split names should contain expected splits');
        assert.deepEqual(await manager.split(expectedSplitName), expectedSplitView, 'manager `split` method returns the split view of the given split name asynchronously');
        const splitViews = await manager.splits();
        assert.equal(splitViews.length, 25, 'manager `splits` method returns the list of split views asynchronously');
        assert.deepEqual(splitViews.find(splitView => splitView.name === expectedSplitName), expectedSplitView, 'manager `split` method returns the split view of the given split name asynchronously');

        await client.ready(); // promise already resolved
        await client.destroy();

        // Validate stored impressions and events
        exec(`echo "LLEN ${config.storage.prefix}.SPLITIO.impressions \n LLEN ${config.storage.prefix}.SPLITIO.events" | redis-cli  -p ${redisPort}`, (error, stdout) => {
          if (error) assert.fail('Redis server should be reachable');

          const trackedImpressionsAndEvents = stdout.split('\n').filter(line => line !== '').map(line => parseInt(line));
          assert.deepEqual(trackedImpressionsAndEvents, [TOTAL_RAW_IMPRESSIONS, TOTAL_EVENTS], 'Tracked impressions and events should be stored in Redis');

          // Validate stored telemetry
          exec(`echo "HLEN ${config.storage.prefix}.SPLITIO.telemetry.latencies \n HLEN ${config.storage.prefix}.SPLITIO.telemetry.exceptions \n HGET ${config.storage.prefix}.SPLITIO.telemetry.init nodejs-${version}/${HOSTNAME_VALUE}/${IP_VALUE}" | redis-cli  -p ${redisPort}`, (error, stdout) => {
            if (error) assert.fail('Redis server should be reachable');

            const [latencies, exceptions, configValue] = stdout.split('\n').filter(line => line !== '').map(JSON.parse);

            assert.true(latencies > 0, 'There are stored latencies');
            assert.true(exceptions === 0, 'There aren\'t stored exceptions');
            assert.deepEqual(configValue, { oM: 1, st: 'redis', aF: 1, rF: 0 }, 'There is stored telemetry config');

            // close server connection
            server.close().then(assert.end);
          });
        });
      });
  });

  t.test('Regular usage - OPTIMIZED strategy', assert => {
    config.sync.impressionsMode = OPTIMIZED;
    initializeRedisServer()
      .then(async (server) => {
        assert.equal(config.sync.impressionsMode, OPTIMIZED, 'impressionsMode should be OPTIMIZED');
        const sdk = SplitFactory(config);
        const client = sdk.client();
        await client.ready();

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('other', 'UT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('other', 'UT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('other', 'UT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('other', 'UT_NOT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('other', 'UT_NOT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('other', 'UT_NOT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
          permissions: ['admin']
        }), 'on', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
          permissions: ['not_matching']
        }), 'off', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
          permissions: ['not_matching']
        }), 'off', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
          permissions: ['not_matching']
        }), 'off', 'Evaluations using Redis storage should be correct.');

        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
          permissions: ['create']
        }), 'off', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
          permissions: ['create']
        }), 'off', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
          permissions: ['create']
        }), 'off', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
          permissions: ['not_matching']
        }), 'on', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
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
        // this should be deduped
        assert.deepEqual(await client.getTreatmentWithConfig('UT_Segment_member', 'always-o.n-with-config'), {
          treatment: 'o.n',
          config: expectedConfig
        }, 'Evaluations using Redis storage should be correct, including configs.');

        assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'on', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'on', 'Evaluations using Redis storage should be correct.');

        // Below splits were added manually to the redis_mock.json file.
        // They are all_keys (always evaluate to on) which depend from always-on split. the _on/off is what treatment they are expecting there.
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on'), 'on', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on'), 'on', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_off'), 'off', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_off'), 'off', 'Evaluations using Redis storage should be correct.');
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on_negated'), 'off', 'Evaluations using Redis storage should be correct.');
        // this should be deduped
        assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on_negated'), 'off', 'Evaluations using Redis storage should be correct.');

        assert.equal(typeof client.track('nicolas@split.io', 'user', 'test.redis.event', 18).then, 'function', 'Track calls should always return a promise on Redis mode.');
        assert.equal(typeof client.track().then, 'function', 'Track calls should always return a promise on Redis mode, even when parameters are incorrect.');

        assert.true(await client.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'If the event was successfully queued the promise will resolve to true');
        assert.false(await client.track(), 'If the event was NOT successfully queued the promise will resolve to false');

        await client.ready(); // promise already resolved
        await client.destroy();

        exec(`echo "HGETALL ${config.storage.prefix}.SPLITIO.impressions.count" | redis-cli  -p ${redisPort}`, async (error, stdout) => {

          const trackedImpressionCounts = stdout.split('\n').filter(line => line !== '');
          assert.deepEqual(trackedImpressionCounts, expectedImpressionCount, 'Tracked impression counts should be stored in Redis');

          // Validate stored impressions and events
          exec(`echo "LLEN ${config.storage.prefix}.SPLITIO.impressions \n LLEN ${config.storage.prefix}.SPLITIO.events" | redis-cli  -p ${redisPort}`, (error, stdout) => {
            if (error) assert.fail('Redis server should be reachable');

            const trackedImpressionsAndEvents = stdout.split('\n').filter(line => line !== '').map(line => parseInt(line));
            assert.deepEqual(trackedImpressionsAndEvents, [TOTAL_RAW_IMPRESSIONS - DEDUPED_IMPRESSIONS, TOTAL_EVENTS], 'Tracked impressions and events should be stored in Redis');

            // Validate stored telemetry
            exec(`echo "HLEN ${config.storage.prefix}.SPLITIO.telemetry.latencies \n HLEN ${config.storage.prefix}.SPLITIO.telemetry.exceptions \n HGET ${config.storage.prefix}.SPLITIO.telemetry.init nodejs-${version}/${HOSTNAME_VALUE}/${IP_VALUE}" | redis-cli  -p ${redisPort}`, (error, stdout) => {
              if (error) assert.fail('Redis server should be reachable');

              const [latencies, exceptions, configValue] = stdout.split('\n').filter(line => line !== '').map(JSON.parse);

              assert.true(latencies > 0, 'There are stored latencies');
              assert.true(exceptions === 0, 'There aren\'t stored exceptions');
              assert.deepEqual(configValue, { oM: 1, st: 'redis', aF: 1, rF: 0 }, 'There is stored telemetry config');

              // close server connection
              server.close().then(assert.end);
            });
          });
        });
      });
  });

  t.test('Regular usage - NONE strategy', assert => {
    config.sync.impressionsMode = NONE;
    initializeRedisServer()
      .then(async (server) => {
        const expectedUniqueKeys = [
          { 'f': 'UT_IN_SEGMENT', 'ks': ['UT_Segment_member', 'other'] },
          { 'f': 'UT_NOT_IN_SEGMENT', 'ks': ['UT_Segment_member', 'other'] },
          { 'f': 'UT_SET_MATCHER', 'ks': ['UT_Segment_member'] },
          { 'f': 'UT_NOT_SET_MATCHER', 'ks': ['UT_Segment_member'] },
          { 'f': 'always-o.n-with-config', 'ks': ['UT_Segment_member'] },
          { 'f': 'always-on', 'ks': ['UT_Segment_member'] },
          { 'f': 'hierarchical_splits_testing_on', 'ks': ['UT_Segment_member'] },
          { 'f': 'hierarchical_splits_testing_off', 'ks': ['UT_Segment_member'] },
          { 'f': 'hierarchical_splits_testing_on_negated', 'ks': ['UT_Segment_member'] },
        ];
        assert.equal(config.sync.impressionsMode, NONE, 'impressionsMode should be NONE');
        const sdk = SplitFactory(config);
        const client = sdk.client();
        await client.ready();

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

        assert.true(await client.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'If the event was successfully queued the promise will resolve to true');
        assert.false(await client.track(), 'If the event was NOT successfully queued the promise will resolve to false');

        await client.ready(); // promise already resolved
        await client.destroy();

        // Validate Impression Counts
        exec(`echo "HGETALL ${config.storage.prefix}.SPLITIO.impressions.count" | redis-cli  -p ${redisPort}`, async (error, stdout) => {

          const trackedImpressionCounts = stdout.split('\n').filter(line => line !== '');
          assert.deepEqual(trackedImpressionCounts, expectedImpressionCount, 'Tracked impression counts should be stored in Redis');

          // Validate unique Keys
          exec(`echo "LRANGE ${config.storage.prefix}.SPLITIO.uniquekeys 0 20" | redis-cli  -p ${redisPort}`, async (error, stdout) => {
            const storedUniqueKeys = stdout.split('\n').filter(line => line !== '').map(JSON.parse);
            assert.deepEqual(storedUniqueKeys, expectedUniqueKeys, 'Unique keys should be stored in Redis');

            // Validate stored impressions and events
            exec(`echo "LLEN ${config.storage.prefix}.SPLITIO.impressions \n LLEN ${config.storage.prefix}.SPLITIO.events" | redis-cli  -p ${redisPort}`, (error, stdout) => {
              if (error) assert.fail('Redis server should be reachable');

              const trackedImpressionsAndEvents = stdout.split('\n').filter(line => line !== '').map(line => parseInt(line));
              assert.deepEqual(trackedImpressionsAndEvents, [0, TOTAL_EVENTS], 'No impressions are stored in Redis in NONE impressions mode');

              // Validate stored telemetry
              exec(`echo "HLEN ${config.storage.prefix}.SPLITIO.telemetry.latencies \n HLEN ${config.storage.prefix}.SPLITIO.telemetry.exceptions \n HGET ${config.storage.prefix}.SPLITIO.telemetry.init nodejs-${version}/${HOSTNAME_VALUE}/${IP_VALUE}" | redis-cli  -p ${redisPort}`, (error, stdout) => {
                if (error) assert.fail('Redis server should be reachable');

                const [latencies, exceptions, configValue] = stdout.split('\n').filter(line => line !== '').map(JSON.parse);

                assert.true(latencies > 0, 'There are stored latencies');
                assert.true(exceptions === 0, 'There aren\'t stored exceptions');
                assert.deepEqual(configValue, { oM: 1, st: 'redis', aF: 1, rF: 0 }, 'There is stored telemetry config');

                config.sync.impressionsMode = DEBUG;

                // close server connection
                server.close().then(assert.end);
              });
            });
          });
        });
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
    assert.plan(18);

    client.getTreatment('UT_Segment_member', 'always-on').then(treatment => {
      assert.equal(treatment, 'control', 'Evaluations using Redis storage should be control until Redis connection is stablished.');
    });
    client.track('nicolas@split.io', 'user', 'test.redis.event', 18).then(result => {
      assert.true(result, 'If the event was successfully queued the promise will resolve to true once Redis connection is stablished');
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

      // Initialize server to emit SDK_READY.
      // We want to validate SDK readiness behavior here, so `initializeRedisServer` is not called because loading Redis with
      // data takes a time, and the SDK will be ready but might evaluate with or without data, resulting in tests flakiness.
      redisServer = new RedisServer(redisPort);
      redisServer.open().then(async () => {
        readyTimestamp = Date.now();
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
      await client.ready();

      const delay = Date.now() - readyTimestamp;
      assert.true(nearlyEqual(delay, 0), 'SDK_READY event is emitted and Ready promise resolved soon once Redis server is connected');

      // some asserts to test regular usage
      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT'), 'on', 'Evaluations using Redis storage should be correct.');
      assert.equal(await client.getTreatment('other', 'UT_IN_SEGMENT'), 'off', 'Evaluations using Redis storage should be correct.');
      assert.true(await client.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'If the event was successfully queued the promise will resolve to true');
      assert.false(await client.track(), 'If the event was NOT successfully queued the promise will resolve to false');

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
        assert.true(await client2.track('nicolas@split.io', 'user', 'test.redis.event', 18), 'If the event was successfully queued the promise will resolve to true');
        assert.false(await client2.track(), 'If the event was NOT successfully queued the promise will resolve to false');

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
          const setting = settingsFactory(config);
          const connection = new RedisClient(setting.storage.options.url);
          const keys = new KeyBuilderSS(validatePrefix(setting.storage.prefix), { s: 'js_someversion', i: 'some_ip', n: 'some_hostname' });
          const eventKey = keys.buildEventsKey();
          const impressionsKey = keys.buildImpressionsKey();

          // Clean up list of events and impressions.
          connection.del(eventKey);
          connection.del(impressionsKey);

          // Init Split client for current config
          const sdk = SplitFactory(config);
          const client = sdk.client();
          await client.ready();

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

  t.test('Getting treatments with flag sets', assert => {
    initializeRedisServer('flag_sets')
      .then(async (server) => {
        const sdk = SplitFactory(config);

        const client = sdk.client();

        client.getTreatmentsWithConfigByFlagSets('other', ['set_one']).then(result => assert.deepEqual(result, {}, 'Flag sets evaluations using Redis storage should be empty until connection is ready.'));

        await client.ready();

        assert.deepEqual(
          await client.getTreatmentsByFlagSet('nico@test', 'set_one'),
          { 'always-on': 'on', 'always-off': 'off' },
          'Evaluations using Redis storage should be correct for a set.'
        );

        assert.deepEqual(
          await client.getTreatmentsWithConfigByFlagSet('nico@test', 'set_one'),
          { 'always-on': { treatment: 'on', config: null }, 'always-off': { treatment: 'off', config: null } },
          'Evaluations with configs using Redis storage should be correct for a set.'
        );

        assert.deepEqual(
          await client.getTreatmentsByFlagSet('nico@test', 'set_two'),
          { 'always-off': 'off', 'nico_not': 'off' },
          'Evaluations using Redis storage should be correct for a set.'
        );

        assert.deepEqual(
          await client.getTreatmentsByFlagSet('nico@test', 'set_invalid'),
          {},
          'Evaluations using Redis storage should properly handle all invalid sets.'
        );

        assert.deepEqual(
          await client.getTreatmentsByFlagSets('nico@test', ['set_two', 'set_one']),
          { 'always-on': 'on', 'always-off': 'off', 'nico_not': 'off' },
          'Evaluations using Redis storage should be correct for multiple sets.'
        );

        assert.deepEqual(
          await client.getTreatmentsWithConfigByFlagSets('nico@test', ['set_two', 'set_one']),
          { 'always-on': { treatment: 'on', config: null }, 'always-off': { treatment: 'off', config: null }, 'nico_not': { treatment: 'off', config: '{"text":"Gallardiola"}' } },
          'Evaluations with configs using Redis storage should be correct for multiple sets.'
        );

        assert.deepEqual(
          await client.getTreatmentsByFlagSets('nico@test', [243, null, 'set_two', 'set_one', 'invalid_set']),
          { 'always-on': 'on', 'always-off': 'off', 'nico_not': 'off' },
          'Evaluations using Redis storage should be correct for multiple sets, discarding invalids.'
        );

        assert.deepEqual(
          await client.getTreatmentsByFlagSets('nico@test', [243, null, 'invalid_set']),
          {},
          'Evaluations using Redis storage should properly handle all invalid sets.'
        );

        await client.ready(); // promise already resolved
        await client.destroy();

        // Validate stored telemetry
        exec(`echo "HLEN ${config.storage.prefix}.SPLITIO.telemetry.latencies \n HKEYS ${config.storage.prefix}.SPLITIO.telemetry.latencies" | redis-cli  -p ${redisPort}`, (error, stdout) => {
          if (error) assert.fail('Redis server should be reachable');

          const [latenciesCount, ...latenciesForFlagSets] = stdout.split('\n').filter(line => line !== '');

          assert.true(parseInt(latenciesCount) > 0, 'There are stored latencies');
          assert.true(latenciesForFlagSets.some(s => s.match(`nodejs-${version}/${HOSTNAME_VALUE}/${IP_VALUE}/treatmentsByFlagSet/`), 'The latency entry for treatmentsByFlagSet should be there.'));
          assert.true(latenciesForFlagSets.some(s => s.match(`nodejs-${version}/${HOSTNAME_VALUE}/${IP_VALUE}/treatmentsByFlagSets/`), 'The latency entry for treatmentsByFlagSets should be there.'));

          // close server connection
          server.close().then(assert.end);
        });

      });
  });
});
