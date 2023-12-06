import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';
import { getStorageHash } from '@splitsoftware/splitio-commons/src/storages/KeyBuilder';

import { nearlyEqual } from '../testUtils';

const DEFAULT_CACHE_EXPIRATION_IN_MILLIS = 864000000; // 10 days

const alwaysOnSplitInverted = JSON.stringify({
  'environment': null,
  'trafficTypeId': null,
  'trafficTypeName': null,
  'name': 'always_on',
  'seed': -790401604,
  'status': 'ACTIVE',
  'killed': false,
  'defaultTreatment': 'off',
  'conditions': [
    {
      'matcherGroup': {
        'combiner': 'AND',
        'matchers': [
          {
            'keySelector': {
              'trafficType': 'user',
              'attribute': null
            },
            'matcherType': 'ALL_KEYS',
            'negate': false,
            'userDefinedSegmentMatcherData': null,
            'whitelistMatcherData': null,
            'unaryNumericMatcherData': null,
            'betweenMatcherData': null
          }
        ]
      },
      'partitions': [
        {
          'treatment': 'off',
          'size': 100
        }
      ]
    }
  ]
});

const splitDeclarations = {
  p1__split: {
    'name': 'p1__split',
    'status': 'ACTIVE',
    'conditions': []
  },
  p2__split: {
    'name': 'p2__split',
    'status': 'ACTIVE',
    'conditions': []
  },
  p3__split: {
    'name': 'p3__split',
    'status': 'ACTIVE',
    'conditions': []
  },
};

const baseConfig = {
  core: {
    authorizationKey: '<fake-token-rfc>',
    key: 'nicolas@split.io'
  },
  scheduler: {
    featuresRefreshRate: 3000,
    segmentsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  startup: {
    readyTimeout: 10,
    requestTimeoutBeforeReady: 10,
    eventsFirstPushWindow: 3000
  },
  streamingEnabled: false
};

const expectedHashNullFilter = '9507ef4'; // for SDK key '<fake-token-rfc>' and filter query null
const expectedHashWithFilter = '6a596ded'; // for SDK key '<fake-token-rfc>' and filter query '&names=p1__split,p2__split'

export default function (fetchMock, assert) {

  assert.test(t => { // Testing when we start from scratch
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheEmpty',
      events: 'https://events.baseurl/readyFromCacheEmpty'
    };
    localStorage.clear();
    t.plan(3);

    fetchMock.get(testUrls.sdk + '/splitChanges?since=-1', { status: 200, body: splitChangesMock1 });
    fetchMock.get(testUrls.sdk + '/splitChanges?since=1457552620999', { status: 200, body: splitChangesMock2 });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas%40split.io', { status: 200, body: mySegmentsNicolas });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas2%40split.io', { status: 200, body: { 'mySegments': [] } });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas3%40split.io', { status: 200, body: { 'mySegments': [] } });

    const splitio = SplitFactory({
      ...baseConfig,
      core: {
        ...baseConfig.core,
        authorizationKey: '<fake-token-rfc>',
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_1'
      },
      urls: testUrls
    });
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('It should not timeout in this scenario.');
      t.end();
    });
    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.fail('It should not emit SDK_READY_FROM_CACHE if there is no cache.');
      t.end();
    });

    client.on(client.Event.SDK_READY, () => {
      t.pass('It should emit SDK_READY alone, since there was no cache.');
    });
    client2.on(client.Event.SDK_READY, () => {
      t.pass('It should emit SDK_READY alone, since there was no cache.');
    });
    client3.on(client.Event.SDK_READY, () => {
      t.pass('It should emit SDK_READY alone, since there was no cache.');
    });

  });

  assert.test(t => { // Testing when we start with cached data but without lastUpdate item (previous version)
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheWithData',
      events: 'https://events.baseurl/readyFromCacheWithData'
    };
    localStorage.clear();
    t.plan(12 * 2 + 3);

    fetchMock.get(testUrls.sdk + '/splitChanges?since=25', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { ...splitChangesMock1, since: 25 }, headers: {} }), 200); }); // 400ms is how long it'll take to reply with Splits, no SDK_READY should be emitted before that.
    });
    fetchMock.get(testUrls.sdk + '/splitChanges?since=1457552620999', { status: 200, body: splitChangesMock2 });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: mySegmentsNicolas, headers: {} }), 400); }); // First client gets segments before splits. No segment cache loading (yet)
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas2%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'mySegments': [] }, headers: {} }), 700); }); // Second client gets segments after 700ms
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas3%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'mySegments': [] }, headers: {} }), 1000); }); // Third client mySegments will come after 1s
    });
    fetchMock.postOnce(testUrls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(testUrls.events + '/testImpressions/count', 200);

    localStorage.setItem('some_user_item', 'user_item');
    localStorage.setItem('readyFromCache_2.SPLITIO.splits.till', 25);
    localStorage.setItem('readyFromCache_2.SPLITIO.split.always_on', alwaysOnSplitInverted);
    localStorage.setItem('readyFromCache_2.SPLITIO.hash', expectedHashNullFilter);

    const startTime = Date.now();
    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_2'
      },
      startup: {
        readyTimeout: 0.85
      },
      urls: testUrls,
      debug: true
    });
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    t.equal(client.getTreatment('always_on'), 'control', 'It should evaluate control treatments if not ready neither by cache nor the cloud');
    t.equal(client3.getTreatment('always_on'), 'control', 'It should evaluate control treatments if not ready neither by cache nor the cloud');

    client.on(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('It should not timeout in this scenario.');
      t.end();
    });

    client.on(client.Event.SDK_READY_FROM_CACHE, () => {
      t.true(Date.now() - startTime < 400, 'It should emit SDK_READY_FROM_CACHE on every client if there was data in the cache and we subscribe on time. Should be considerably faster than actual readiness from the cloud.');
      t.equal(client.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control due to Input Validation');
    });
    client2.on(client2.Event.SDK_READY_FROM_CACHE, () => {
      t.true(Date.now() - startTime < 400, 'It should emit SDK_READY_FROM_CACHE on every client if there was data in the cache and we subscribe on time. Should be considerably faster than actual readiness from the cloud.');
      t.equal(client2.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control due to Input Validation');
    });
    client3.on(client3.Event.SDK_READY_FROM_CACHE, () => {
      t.true(Date.now() - startTime < 400, 'It should emit SDK_READY_FROM_CACHE on every client if there was data in the cache and we subscribe on time. Should be considerably faster than actual readiness from the cloud.');
      t.equal(client3.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control due to Input Validation');
    });

    client.on(client.Event.SDK_READY, () => {
      t.true(Date.now() - startTime >= 400, 'It should emit SDK_READY too but after syncing with the cloud.');
      t.equal(client.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client.ready().then(() => {
      t.true(Date.now() - startTime >= 400, 'It should resolve ready promise after syncing with the cloud.');
      t.equal(client.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client2.on(client2.Event.SDK_READY, () => {
      t.true(Date.now() - startTime >= 700, 'It should emit SDK_READY too but after syncing with the cloud.');
      t.equal(client2.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client2.ready().then(() => {
      t.true(Date.now() - startTime >= 700, 'It should resolve ready promise after syncing with the cloud.');
      t.equal(client2.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY, () => {
      client3.ready().then(() => {
        t.true(Date.now() - startTime >= 1000, 'It should resolve ready promise after syncing with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');

        // Last cb: destroy clients and check that localstorage has the expected items
        Promise.all([client3.destroy(), client2.destroy(), client.destroy()]).then(() => {
          t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
          t.equal(localStorage.getItem('readyFromCache_2.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
          t.true(nearlyEqual(parseInt(localStorage.getItem('readyFromCache_2.SPLITIO.splits.lastUpdated')), Date.now() - 800 /* 800 ms between last Split and MySegments fetch */), 'lastUpdated is added and must correspond to the timestamp of the last successfully fetched Splits');
        });
      });
      t.true(Date.now() - startTime >= 1000, 'It should emit SDK_READY too but after syncing with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY_TIMED_OUT, () => {
      client3.ready().catch(() => {
        t.true(Date.now() - startTime >= 850, 'It should reject ready promise before syncing mySegments data with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with mySegments data from cache.');
      });
      t.true(Date.now() - startTime >= 850, 'It should emit SDK_READY_TIMED_OUT before syncing mySegments data with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with mySegments data from cache.');
    });
  });

  assert.test(t => { // Testing when we start with cached data and not expired (lastUpdate item higher than expirationTimestamp)
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheWithData3',
      events: 'https://events.baseurl/readyFromCacheWithData3'
    };
    localStorage.clear();
    t.plan(12 * 2 + 5);

    fetchMock.get(testUrls.sdk + '/splitChanges?since=25', function () {
      t.equal(localStorage.getItem('readyFromCache_3.SPLITIO.split.always_on'), alwaysOnSplitInverted, 'splits must not be cleaned from cache');
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { ...splitChangesMock1, since: 25 }, headers: {} }), 200); }); // 400ms is how long it'll take to reply with Splits, no SDK_READY should be emitted before that.
    });
    fetchMock.get(testUrls.sdk + '/splitChanges?since=1457552620999', { status: 200, body: splitChangesMock2 });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: mySegmentsNicolas, headers: {} }), 400); }); // First client gets segments before splits. No segment cache loading (yet)
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas2%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'mySegments': [] }, headers: {} }), 700); }); // Second client gets segments after 700ms
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas3%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'mySegments': [] }, headers: {} }), 1000); }); // Third client mySegments will come after 1s
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas4%40split.io', { 'mySegments': [] });
    fetchMock.postOnce(testUrls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(testUrls.events + '/testImpressions/count', 200);

    localStorage.setItem('some_user_item', 'user_item');
    localStorage.setItem('readyFromCache_3.SPLITIO.splits.till', 25);
    localStorage.setItem('readyFromCache_3.SPLITIO.splits.lastUpdated', Date.now());
    localStorage.setItem('readyFromCache_3.SPLITIO.split.always_on', alwaysOnSplitInverted);
    localStorage.setItem('readyFromCache_3.SPLITIO.hash', expectedHashNullFilter);

    const startTime = Date.now();
    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_3'
      },
      startup: {
        readyTimeout: 0.85
      },
      urls: testUrls,
      debug: true
    });
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    t.equal(client.getTreatment('always_on'), 'control', 'It should evaluate control treatments if not ready neither by cache nor the cloud');
    t.equal(client3.getTreatment('always_on'), 'control', 'It should evaluate control treatments if not ready neither by cache nor the cloud');

    client.on(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('It should not timeout in this scenario.');
      t.end();
    });

    client.on(client.Event.SDK_READY_FROM_CACHE, () => {
      t.true(Date.now() - startTime < 400, 'It should emit SDK_READY_FROM_CACHE on every client if there was data in the cache and we subscribe on time. Should be considerably faster than actual readiness from the cloud.');
      t.equal(client.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control due to Input Validation');

      const client4 = splitio.client('nicolas4@split.io');
      t.equal(client4.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control');

      client4.on(client4.Event.SDK_READY_FROM_CACHE, () => {
        t.fail('It should not emit SDK_READY_FROM_CACHE if already done.');
      });
    });
    client2.on(client2.Event.SDK_READY_FROM_CACHE, () => {
      t.true(Date.now() - startTime < 400, 'It should emit SDK_READY_FROM_CACHE on every client if there was data in the cache and we subscribe on time. Should be considerably faster than actual readiness from the cloud.');
      t.equal(client2.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control due to Input Validation');
    });
    client3.on(client3.Event.SDK_READY_FROM_CACHE, () => {
      t.true(Date.now() - startTime < 400, 'It should emit SDK_READY_FROM_CACHE on every client if there was data in the cache and we subscribe on time. Should be considerably faster than actual readiness from the cloud.');
      t.equal(client3.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control due to Input Validation');
    });

    client.on(client.Event.SDK_READY, () => {
      t.true(Date.now() - startTime >= 400, 'It should emit SDK_READY too but after syncing with the cloud.');
      t.equal(client.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client.ready().then(() => {
      t.true(Date.now() - startTime >= 400, 'It should resolve ready promise after syncing with the cloud.');
      t.equal(client.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client2.on(client2.Event.SDK_READY, () => {
      t.true(Date.now() - startTime >= 700, 'It should emit SDK_READY too but after syncing with the cloud.');
      t.equal(client2.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client2.ready().then(() => {
      t.true(Date.now() - startTime >= 700, 'It should resolve ready promise after syncing with the cloud.');
      t.equal(client2.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY, () => {
      client3.ready().then(() => {
        t.true(Date.now() - startTime >= 1000, 'It should resolve ready promise after syncing with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');

        // Last cb: destroy clients and check that localstorage has the expected items
        Promise.all([client3.destroy(), client2.destroy(), client.destroy()]).then(() => {
          t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
          t.equal(localStorage.getItem('readyFromCache_3.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
          t.true(nearlyEqual(parseInt(localStorage.getItem('readyFromCache_3.SPLITIO.splits.lastUpdated')), Date.now() - 800 /* 800 ms between last Split and MySegments fetch */), 'lastUpdated must correspond to the timestamp of the last successfully fetched Splits');
        });
      });
      t.true(Date.now() - startTime >= 1000, 'It should emit SDK_READY too but after syncing with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY_TIMED_OUT, () => {
      client3.ready().catch(() => {
        t.true(Date.now() - startTime >= 850, 'It should reject ready promise before syncing mySegments data with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with mySegments data from cache.');
      });
      t.true(Date.now() - startTime >= 850, 'It should emit SDK_READY_TIMED_OUT before syncing mySegments data with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with mySegments data from cache.');
    });
  });

  assert.test(t => { // Testing when we start with cached data but expired (lastUpdate item lower than expirationTimestamp)
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheWithData4',
      events: 'https://events.baseurl/readyFromCacheWithData4'
    };
    localStorage.clear();
    t.plan(9 * 2 + 5);

    fetchMock.get(testUrls.sdk + '/splitChanges?since=-1', function () {
      t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
      t.equal(localStorage.length, 1, 'split cache data must be cleaned from localStorage');
      return { status: 200, body: splitChangesMock1 };
    });
    fetchMock.get(testUrls.sdk + '/splitChanges?since=1457552620999', { status: 200, body: splitChangesMock2 });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: mySegmentsNicolas, headers: {} }), 400); }); // First client gets segments before splits. No segment cache loading (yet)
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas2%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'mySegments': [] }, headers: {} }), 700); }); // Second client gets segments after 700ms
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas3%40split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'mySegments': [] }, headers: {} }), 1000); }); // Third client mySegments will come after 1s
    });
    fetchMock.postOnce(testUrls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(testUrls.events + '/testImpressions/count', 200);

    localStorage.setItem('some_user_item', 'user_item');
    localStorage.setItem('readyFromCache_4.SPLITIO.splits.till', 25);
    localStorage.setItem('readyFromCache_4.SPLITIO.splits.lastUpdated', Date.now() - DEFAULT_CACHE_EXPIRATION_IN_MILLIS - 1); // -1 to ensure having an expired lastUpdated item
    localStorage.setItem('readyFromCache_4.SPLITIO.split.always_on', alwaysOnSplitInverted);
    localStorage.setItem('readyFromCache_4.SPLITIO.hash', expectedHashNullFilter);

    const startTime = Date.now();
    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_4'
      },
      startup: {
        readyTimeout: 0.85
      },
      urls: testUrls,
      debug: true
    });
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    t.equal(client.getTreatment('always_on'), 'control', 'It should evaluate control treatments if not ready neither by cache nor the cloud');
    t.equal(client3.getTreatment('always_on'), 'control', 'It should evaluate control treatments if not ready neither by cache nor the cloud');

    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('It should not timeout in this scenario.');
      t.end();
    });

    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.fail('It should not emit SDK_READY_FROM_CACHE if there is expired cache.');
      t.end();
    });
    client2.once(client2.Event.SDK_READY_FROM_CACHE, () => {
      t.fail('It should not emit SDK_READY_FROM_CACHE if there is expired cache.');
      t.end();
    });
    client3.once(client3.Event.SDK_READY_FROM_CACHE, () => {
      t.fail('It should not emit SDK_READY_FROM_CACHE if there is expired cache.');
      t.end();
    });

    client.on(client.Event.SDK_READY, () => {
      t.true(Date.now() - startTime >= 400, 'It should emit SDK_READY after syncing with the cloud.');
      t.equal(client.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client.ready().then(() => {
      t.true(Date.now() - startTime >= 400, 'It should resolve ready promise after syncing with the cloud.');
      t.equal(client.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client2.on(client2.Event.SDK_READY, () => {
      t.true(Date.now() - startTime >= 700, 'It should emit SDK_READY after syncing with the cloud.');
      t.equal(client2.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client2.ready().then(() => {
      t.true(Date.now() - startTime >= 700, 'It should resolve ready promise after syncing with the cloud.');
      t.equal(client2.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY, () => {
      client3.ready().then(() => {
        t.true(Date.now() - startTime >= 1000, 'It should resolve ready promise after syncing with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');

        // Last cb: destroy clients and check that localstorage has the expected items
        Promise.all([client3.destroy(), client2.destroy(), client.destroy()]).then(() => {
          t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
          t.equal(localStorage.getItem('readyFromCache_4.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
          t.true(nearlyEqual(parseInt(localStorage.getItem('readyFromCache_4.SPLITIO.splits.lastUpdated')), Date.now() - 1000 /* 1000 ms between last Split and MySegments fetch */), 'lastUpdated must correspond to the timestamp of the last successfully fetched Splits');
        });
      });
      t.true(Date.now() - startTime >= 1000, 'It should emit SDK_READY after syncing with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY_TIMED_OUT, () => {
      client3.ready().catch(() => {
        t.true(Date.now() - startTime >= 850, 'It should reject ready promise before syncing mySegments data with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'control', 'It should not evaluate treatments with mySegments data from cache.');
      });
      t.true(Date.now() - startTime >= 850, 'It should emit SDK_READY_TIMED_OUT before syncing mySegments data with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'control', 'It should evaluate treatments with mySegments data from cache.');
    });
  });

  /** Fetch specific splits **/

  assert.test(t => { // Testing when we start with cached data without storage hash (previous version), and a valid split filter config
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCache_5',
      events: 'https://events.baseurl/readyFromCache_5'
    };
    localStorage.clear();
    t.plan(7);

    fetchMock.getOnce(testUrls.sdk + '/splitChanges?since=-1&names=p1__split,p2__split', { status: 200, body: { splits: [splitDeclarations.p1__split, splitDeclarations.p2__split], since: -1, till: 1457552620999 } }, { delay: 10 }); // short delay to let emit SDK_READY_FROM_CACHE
    // fetchMock.getOnce(testUrls.sdk + '/splitChanges?since=1457552620999&names=p1__split', { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
    fetchMock.getOnce(testUrls.sdk + '/mySegments/nicolas%40split.io', { status: 200, body: { mySegments: [] } });

    localStorage.setItem('some_user_item', 'user_item');
    localStorage.setItem('readyFromCache_5.SPLITIO.splits.till', 25);
    localStorage.setItem('readyFromCache_5.SPLITIO.split.p2__split', JSON.stringify(splitDeclarations.p2__split));
    localStorage.setItem('readyFromCache_5.SPLITIO.split.p3__split', JSON.stringify(splitDeclarations.p3__split));
    localStorage.setItem('readyFromCache_5.SPLITIO.splits.filterQuery', '&names=p2__split,p3__split'); // Deprecated item, should be cleaned

    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_5'
      },
      urls: testUrls,
      sync: {
        splitFilters: [{ type: 'byName', values: ['p2__split', 'p1__split'] }, { type: 'byName', values: ['p2__split', null] }]
      },
      debug: true
    });
    const client = splitio.client();
    const manager = splitio.manager();

    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.fail('It should not emit SDK_READY_FROM_CACHE because localstorage is cleaned and there isn\'t cached data');
      t.end();
    });

    client.once(client.Event.SDK_READY, () => {
      t.deepEqual(manager.names().sort(), ['p1__split', 'p2__split'], 'p1__split should be added for evaluation');

      client.destroy().then(() => {
        t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
        t.equal(localStorage.getItem('readyFromCache_5.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
        t.equal(localStorage.getItem('readyFromCache_5.SPLITIO.split.p1__split'), JSON.stringify(splitDeclarations.p1__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_5.SPLITIO.split.p2__split'), JSON.stringify(splitDeclarations.p2__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_5.SPLITIO.hash'), expectedHashWithFilter, 'Storage hash must correspond to the one for the SDK key and feature flag filter query');
        t.equal(localStorage.getItem('readyFromCache_5.SPLITIO.splits.filterQuery'), null);
        t.end();
      });
    });
  });

  assert.test(t => { // Testing when we start from scratch, and a valid split filter config
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCache_5B',
      events: 'https://events.baseurl/readyFromCache_5B'
    };
    localStorage.clear();
    t.plan(5);

    fetchMock.getOnce(testUrls.sdk + '/splitChanges?since=-1&names=p1__split,p2__split', { status: 200, body: { splits: [splitDeclarations.p1__split, splitDeclarations.p2__split], since: -1, till: 1457552620999 } }, { delay: 10 }); // short delay to let emit SDK_READY_FROM_CACHE
    fetchMock.getOnce(testUrls.sdk + '/mySegments/nicolas%40split.io', { status: 200, body: { mySegments: [] } });

    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_5B'
      },
      urls: testUrls,
      sync: {
        splitFilters: [{ type: 'byName', values: ['p2__split', 'p1__split'] }, { type: 'byName', values: ['p2__split', null] }]
      },
      debug: true
    });
    const client = splitio.client();
    const manager = splitio.manager();

    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.fail('It should not emit SDK_READY_FROM_CACHE if cache is empty.');
      t.end();
    });

    client.once(client.Event.SDK_READY, () => {
      t.deepEqual(manager.names(), ['p1__split', 'p2__split'], 'p1__split should be added for evaluation');

      client.destroy().then(() => {
        t.equal(localStorage.getItem('readyFromCache_5B.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
        t.equal(localStorage.getItem('readyFromCache_5B.SPLITIO.split.p1__split'), JSON.stringify(splitDeclarations.p1__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_5B.SPLITIO.split.p2__split'), JSON.stringify(splitDeclarations.p2__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_5B.SPLITIO.hash'), expectedHashWithFilter, 'Storage hash must correspond to the split filter query and SDK key');
        t.end();
      });
    });
  });

  assert.test(t => { // Testing when we start with cached data with split filter, and the same split filter is provided in the config
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCache_6',
      events: 'https://events.baseurl/readyFromCache_6'
    };
    localStorage.clear();
    t.plan(7);

    fetchMock.getOnce(testUrls.sdk + '/splitChanges?since=25&names=p2__split&prefixes=p1', { status: 200, body: { splits: [splitDeclarations.p1__split, splitDeclarations.p2__split], since: 25, till: 1457552620999 } }, { delay: 10 }); // short delay to let emit SDK_READY_FROM_CACHE
    fetchMock.getOnce(testUrls.sdk + '/mySegments/nicolas%40split.io', { status: 200, body: { mySegments: [] } });

    const expectedHash = getStorageHash({ ...baseConfig, sync: { __splitFiltersValidation: { queryString: '&names=p2__split&prefixes=p1' } } });
    localStorage.setItem('some_user_item', 'user_item');
    localStorage.setItem('readyFromCache_6.SPLITIO.splits.till', 25);
    localStorage.setItem('readyFromCache_6.SPLITIO.split.p1__split', JSON.stringify(splitDeclarations.p1__split));
    localStorage.setItem('readyFromCache_6.SPLITIO.split.p2__split', JSON.stringify(splitDeclarations.p2__split));
    localStorage.setItem('readyFromCache_6.SPLITIO.hash', expectedHash);

    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_6'
      },
      urls: testUrls,
      sync: {
        splitFilters: [{ type: 'byName', values: [undefined, true, 'p2__split'] }, { type: 'byPrefix', values: ['p1'] }, { type: 'byName', values: ['p2__split'] }]
      },
      debug: true
    });
    const client = splitio.client();
    const manager = splitio.manager();

    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.deepEqual(manager.names(), ['p2__split', 'p1__split'], 'splits shouldn\'t be removed for evaluation');
    });

    client.once(client.Event.SDK_READY, () => {
      t.deepEqual(manager.names(), ['p2__split', 'p1__split'], 'active splits should be present for evaluation');

      client.destroy().then(() => {
        t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
        t.equal(localStorage.getItem('readyFromCache_6.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
        t.equal(localStorage.getItem('readyFromCache_6.SPLITIO.split.p1__split'), JSON.stringify(splitDeclarations.p1__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_6.SPLITIO.split.p2__split'), JSON.stringify(splitDeclarations.p2__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_6.SPLITIO.hash'), expectedHash, 'Storage hash must correspond to the split filter query and SDK key');
        t.end();
      });
    });
  });

  assert.test(t => { // Testing when we start with cached data with split filter but expired, and the same split filter is provided in the config
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCache_7',
      events: 'https://events.baseurl/readyFromCache_7'
    };
    localStorage.clear();
    t.plan(6);

    fetchMock.getOnce(testUrls.sdk + '/splitChanges?since=-1&prefixes=p1,p2', { status: 200, body: { splits: [splitDeclarations.p1__split, splitDeclarations.p2__split], since: -1, till: 1457552620999 } }, { delay: 10 }); // short delay to let emit SDK_READY_FROM_CACHE
    fetchMock.getOnce(testUrls.sdk + '/mySegments/nicolas%40split.io', { status: 200, body: { mySegments: [] } });

    const expectedHash = getStorageHash({ ...baseConfig, sync: { __splitFiltersValidation: { queryString: '&prefixes=p1,p2' } } });
    localStorage.setItem('some_user_item', 'user_item');
    localStorage.setItem('readyFromCache_7.SPLITIO.splits.till', 25);
    localStorage.setItem('readyFromCache_7.SPLITIO.split.p1__split', JSON.stringify(splitDeclarations.p1__split));
    localStorage.setItem('readyFromCache_7.SPLITIO.split.p2__split', JSON.stringify(splitDeclarations.p2__split));
    localStorage.setItem('readyFromCache_7.SPLITIO.hash', expectedHash);
    localStorage.setItem('readyFromCache_7.SPLITIO.splits.lastUpdated', Date.now() - DEFAULT_CACHE_EXPIRATION_IN_MILLIS - 1); // -1 to ensure having an expired lastUpdated item

    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_7'
      },
      urls: testUrls,
      sync: {
        splitFilters: [{ type: 'byPrefix', values: ['p2'] }, { type: 'byPrefix', values: ['p1', ''] }, { type: '', values: [] }, {}, { type: 'byPrefix' }]
      },
      debug: true
    });
    const client = splitio.client();
    const manager = splitio.manager();

    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.fail('It should not emit SDK_READY_FROM_CACHE if cache has expired.');
      t.end();
    });

    client.once(client.Event.SDK_READY, () => {
      t.deepEqual(manager.names(), ['p2__split', 'p1__split'], 'active splits should be present for evaluation');

      client.destroy().then(() => {
        t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
        t.equal(localStorage.getItem('readyFromCache_7.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
        t.equal(localStorage.getItem('readyFromCache_7.SPLITIO.split.p1__split'), JSON.stringify(splitDeclarations.p1__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_7.SPLITIO.split.p2__split'), JSON.stringify(splitDeclarations.p2__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_7.SPLITIO.hash'), expectedHash, 'Storage hash must correspond to the split filter query and SDK key');
        t.end();
      });
    });
  });

  assert.test(assert => { // Testing when we start with cached data with split filter, and no or invalid split filter config (null query string)

    const syncParamsWithNullSplitQuery = [
      // not defined sync config param
      undefined,
      // invalid splitFilters param
      { splitFilters: 'invalid' },
      // splitFilters param with all filters invalid
      { splitFilters: [{ type: 'byTag', values: ['some_tag'] }] }
    ];

    syncParamsWithNullSplitQuery.forEach(syncParam => {

      assert.test(t => {
        const testUrls = {
          sdk: 'https://sdk.baseurl/readyFromCache_8',
          events: 'https://events.baseurl/readyFromCache_8'
        };
        localStorage.clear();
        t.plan(7);

        fetchMock.getOnce(testUrls.sdk + '/splitChanges?since=-1', { status: 200, body: { splits: [splitDeclarations.p1__split, splitDeclarations.p2__split, splitDeclarations.p3__split], since: -1, till: 1457552620999 } }, { delay: 10 }); // short delay to let emit SDK_READY_FROM_CACHE
        fetchMock.getOnce(testUrls.sdk + '/mySegments/nicolas%40split.io', { status: 200, body: { mySegments: [] } });

        localStorage.setItem('some_user_item', 'user_item');
        localStorage.setItem('readyFromCache_8.SPLITIO.splits.till', 25);
        localStorage.setItem('readyFromCache_8.SPLITIO.split.p1__split', JSON.stringify(splitDeclarations.p1__split));
        localStorage.setItem('readyFromCache_8.SPLITIO.split.p2__split', JSON.stringify(splitDeclarations.p2__split));
        localStorage.setItem('readyFromCache_8.SPLITIO.split.deleted__split', '{ "name": "deleted_split" }');
        localStorage.setItem('readyFromCache_8.SPLITIO.hash', expectedHashWithFilter);

        const splitio = SplitFactory({
          ...baseConfig,
          storage: {
            type: 'LOCALSTORAGE',
            prefix: 'readyFromCache_8'
          },
          urls: testUrls,
          sync: syncParam,
          debug: true
        });
        const client = splitio.client();
        const manager = splitio.manager();

        client.once(client.Event.SDK_READY_FROM_CACHE, () => {
          t.fail('It should not emit SDK_READY_FROM_CACHE because all splits were removed from cache since the filter query changed.');
          t.end();
        });

        client.once(client.Event.SDK_READY, () => {
          t.deepEqual(manager.names().sort(), ['p1__split', 'p2__split', 'p3__split'], 'active splits should be present for evaluation');

          client.destroy().then(() => {
            t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
            t.equal(localStorage.getItem('readyFromCache_8.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
            t.equal(localStorage.getItem('readyFromCache_8.SPLITIO.split.p1__split'), JSON.stringify(splitDeclarations.p1__split), 'split declarations must be cached');
            t.equal(localStorage.getItem('readyFromCache_8.SPLITIO.split.p2__split'), JSON.stringify(splitDeclarations.p2__split), 'split declarations must be cached');
            t.equal(localStorage.getItem('readyFromCache_8.SPLITIO.split.p3__split'), JSON.stringify(splitDeclarations.p3__split), 'split declarations must be cached');
            t.equal(localStorage.getItem('readyFromCache_8.SPLITIO.hash'), expectedHashNullFilter, 'Storage hash must correspond to the split filter query and SDK key');
            t.end();
          });
        });
      });

    });
  });

  assert.test(t => { // Testing when we start with cached data with split filter, and a new split filter is provided in the config
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCache_9',
      events: 'https://events.baseurl/readyFromCache_9'
    };
    localStorage.clear();
    t.plan(6);

    fetchMock.getOnce(testUrls.sdk + '/splitChanges?since=-1&names=no%20exist%20trim,no_exist,p3__split&prefixes=no%20exist%20trim,p2', { status: 200, body: { splits: [splitDeclarations.p2__split, splitDeclarations.p3__split], since: -1, till: 1457552620999 } }, { delay: 10 }); // short delay to let emit SDK_READY_FROM_CACHE
    fetchMock.getOnce(testUrls.sdk + '/mySegments/nicolas%40split.io', { status: 200, body: { mySegments: [] } });

    localStorage.setItem('some_user_item', 'user_item');
    localStorage.setItem('readyFromCache_9.SPLITIO.splits.till', 25);
    localStorage.setItem('readyFromCache_9.SPLITIO.split.p1__split', JSON.stringify(splitDeclarations.p1__split));
    localStorage.setItem('readyFromCache_9.SPLITIO.split.p2__split', JSON.stringify(splitDeclarations.p2__split));
    localStorage.setItem('readyFromCache_9.SPLITIO.hash', getStorageHash({ ...baseConfig, sync: { __splitFiltersValidation: { queryString: '&names=p2__split&prefixes=p1' } } }));

    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_9'
      },
      urls: testUrls,
      sync: {
        splitFilters: [{ type: 'byName', values: ['p3__split'] }, { type: 'byPrefix', values: ['    p2', '   p2', '  p2', ' p2', 'no exist trim      '] }, { type: 'byName', values: ['no_exist', ' no exist trim     '] }]
      },
      debug: true
    });
    const client = splitio.client();
    const manager = splitio.manager();

    client.once(client.Event.SDK_READY, () => {
      t.deepEqual(manager.names(), ['p3__split', 'p2__split'], 'active splits should be present for evaluation');

      client.destroy().then(() => {
        t.equal(localStorage.getItem('some_user_item'), 'user_item', 'user items at localStorage must not be changed');
        t.equal(localStorage.getItem('readyFromCache_9.SPLITIO.splits.till'), '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
        t.equal(localStorage.getItem('readyFromCache_9.SPLITIO.split.p2__split'), JSON.stringify(splitDeclarations.p2__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_9.SPLITIO.split.p3__split'), JSON.stringify(splitDeclarations.p3__split), 'split declarations must be cached');
        t.equal(localStorage.getItem('readyFromCache_9.SPLITIO.hash'), getStorageHash({ ...baseConfig, sync: { __splitFiltersValidation: { queryString: '&names=no%20exist%20trim,no_exist,p3__split&prefixes=no%20exist%20trim,p2' } } }), 'splits.filterQuery must correspond to the split filter query');
        t.end();
      });
    });
  });

}
