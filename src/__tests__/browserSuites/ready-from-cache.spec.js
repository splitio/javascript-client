import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';

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

const baseConfig = {
  core: {
    authorizationKey: '<fake-token-rfc>',
    key: 'nicolas@split.io'
  },
  scheduler: {
    featuresRefreshRate: 3000,
    segmentsRefreshRate: 3000,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  startup: {
    readyTimeout: 10,
    requestTimeoutBeforeReady: 10,
    eventsFirstPushWindow: 3000
  }
};

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
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas@split.io', { status: 200, body: mySegmentsNicolas });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas2@split.io', { status: 200, body: { 'mySegments': [] } });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas3@split.io', { status: 200, body: { 'mySegments': [] } });

    const splitio = SplitFactory({
      ...baseConfig,
      core: {
        ...baseConfig.core,
        authorizationKey: '<fake-token-rfc2>',
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

  assert.test(t => {
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheWithData',
      events: 'https://events.baseurl/readyFromCacheWithData'
    };
    localStorage.clear();
    t.plan(12 * 2);

    fetchMock.get(testUrls.sdk + '/splitChanges?since=25', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { ...splitChangesMock1, since: 25 }, headers: {} }), 200); }); // 400ms is how long it'll take to reply with Splits, no SDK_READY should be emitted before that.
    });
    fetchMock.get(testUrls.sdk + '/splitChanges?since=1457552620999', { status: 200, body: splitChangesMock2 });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas@split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: mySegmentsNicolas, headers: {} }), 400); }); // First client gets segments before splits. No segment cache loading (yet)
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas2@split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'mySegments': [] }, headers: {} }), 700); }); // Second client gets segments after 700ms
    });
    fetchMock.get(testUrls.sdk + '/mySegments/nicolas3@split.io', function () {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'mySegments': [] }, headers: {} }), 1000); }); // Third client mySegments will come after 1s
    });
    fetchMock.postOnce(testUrls.events + '/testImpressions/bulk', 200);

    localStorage.setItem('readyFromCache_2.SPLITIO.splits.till', 25);
    localStorage.setItem('readyFromCache_2.SPLITIO.split.always_on', alwaysOnSplitInverted);

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

    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('It should not timeout in this scenario.');
      t.end();
    });

    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.true(Date.now() - startTime < 400, 'It should emit SDK_READY_FROM_CACHE on every client if there was data in the cache and we subscribe on time. Should be considerably faster than actual readiness from the cloud.');
      t.equal(client.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control due to Input Validation');
    });
    client2.once(client2.Event.SDK_READY_FROM_CACHE, () => {
      t.true(Date.now() - startTime < 400, 'It should emit SDK_READY_FROM_CACHE on every client if there was data in the cache and we subscribe on time. Should be considerably faster than actual readiness from the cloud.');
      t.equal(client2.getTreatment('always_on'), 'off', 'It should evaluate treatments with data from cache instead of control due to Input Validation');
    });
    client3.once(client3.Event.SDK_READY_FROM_CACHE, () => {
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
}
