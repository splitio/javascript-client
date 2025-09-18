import sinon from 'sinon';
import { nearlyEqual } from '../testUtils';
import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import membershipsNicolas from '../mocks/memberships.nicolas@split.io.json';

import { DEFAULT_CACHE_EXPIRATION_IN_MILLIS, alwaysOnSplitInverted, splitDeclarations, baseConfig, expectedHashNullFilter } from './ready-from-cache.spec';

const customWrapper = (() => {
  let cache = {};
  return {
    getItem(key) {
      return Promise.resolve(cache[key] || null);
    },
    setItem(key, value) {
      cache[key] = value;
      return Promise.resolve();
    },
    removeItem(key) {
      delete cache[key];
      return Promise.resolve();
    },

    // For testing purposes:
    clear() {
      cache = {};
    },
    getCache() {
      return cache;
    }
  };
})();

export default function (fetchMock, assert) {

  assert.test(t => { // Testing when we start from scratch
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheWrapperEmpty',
      events: 'https://events.baseurl/readyFromCacheWrapperEmpty'
    };
    customWrapper.clear();
    t.plan(4);

    fetchMock.get(testUrls.sdk + '/splitChanges?s=1.3&since=-1&rbSince=-1', { status: 200, body: splitChangesMock1 });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas%40split.io', { status: 200, body: membershipsNicolas });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas2%40split.io', { status: 200, body: { 'ms': {} } });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas3%40split.io', { status: 200, body: { 'ms': {} } });

    const splitio = SplitFactory({
      ...baseConfig,
      core: {
        ...baseConfig.core,
        authorizationKey: '<fake-token-rfc>',
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_1',
        wrapper: customWrapper
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
      t.true(client.__getStatus().isReady, 'Client should emit SDK_READY_FROM_CACHE alongside SDK_READY');
    });

    client.on(client.Event.SDK_READY, () => {
      t.true(client.__getStatus().isReadyFromCache, 'Client should emit SDK_READY and it should be ready from cache');
    });
    client2.on(client.Event.SDK_READY, () => {
      t.true(client2.__getStatus().isReadyFromCache, 'Non-default client should emit SDK_READY and it should be ready from cache');
    });
    client3.on(client.Event.SDK_READY, () => {
      t.true(client2.__getStatus().isReadyFromCache, 'Non-default client should emit SDK_READY and it should be ready from cache');
    });

  });

  assert.test(t => { // Testing when we start with cached data and not expired (lastUpdate timestamp higher than default (10) expirationDays ago)
    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheWrapperWithData3',
      events: 'https://events.baseurl/readyFromCacheWrapperWithData3'
    };
    customWrapper.clear();
    t.plan(12 * 2 + 5);

    fetchMock.get(testUrls.sdk + '/splitChanges?s=1.3&since=25&rbSince=-1', () => {
      t.equal(JSON.parse(customWrapper.getCache()['readyFromCache_3.SPLITIO'])['readyFromCache_3.SPLITIO.split.always_on'], alwaysOnSplitInverted, 'feature flags must not be cleaned from cache');
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { ff: { ...splitChangesMock1.ff, s: 25 } }, headers: {} }), 200); }); // 400ms is how long it'll take to reply with Splits, no SDK_READY should be emitted before that.
    });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas%40split.io', () => {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: membershipsNicolas, headers: {} }), 400); }); // First client gets segments before splits. No segment cache loading (yet)
    });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas2%40split.io', () => {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'ms': {} }, headers: {} }), 700); }); // Second client gets segments after 700ms
    });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas3%40split.io', () => {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'ms': {} }, headers: {} }), 1000); }); // Third client memberships will come after 1s
    });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas4%40split.io', { 'ms': {} });
    fetchMock.postOnce(testUrls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(testUrls.events + '/testImpressions/count', 200);


    customWrapper.getCache()['some_user_item'] = 'user_item';
    customWrapper.getCache()['readyFromCache_3.SPLITIO'] = JSON.stringify({
      'readyFromCache_3.SPLITIO.splits.till': '25',
      'readyFromCache_3.SPLITIO.splits.lastUpdated': Date.now().toString(),
      'readyFromCache_3.SPLITIO.split.always_on': alwaysOnSplitInverted,
      'readyFromCache_3.SPLITIO.hash': expectedHashNullFilter
    });

    const startTime = Date.now();
    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_3',
        wrapper: customWrapper
      },
      startup: {
        readyTimeout: 0.85
      },
      urls: testUrls,
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

        // Last cb: destroy clients and check that storage wrapper has the expected items
        Promise.all([client3.destroy(), client2.destroy(), client.destroy()]).then(() => {
          t.equal(customWrapper.getCache()['some_user_item'], 'user_item', 'user items at storage wrapper must not be changed');
          t.equal(JSON.parse(customWrapper.getCache()['readyFromCache_3.SPLITIO'])['readyFromCache_3.SPLITIO.splits.till'], '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
          t.true(nearlyEqual(parseInt(JSON.parse(customWrapper.getCache()['readyFromCache_3.SPLITIO'])['readyFromCache_3.SPLITIO.splits.lastUpdated']), Date.now() - 800 /* 800 ms between last Split and memberships fetch */), 'lastUpdated must correspond to the timestamp of the last successfully fetched Splits');
        });
      });
      t.true(Date.now() - startTime >= 1000, 'It should emit SDK_READY too but after syncing with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY_TIMED_OUT, () => {
      client3.ready().catch(() => {
        t.true(Date.now() - startTime >= 850, 'It should reject ready promise before syncing memberships data with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with memberships data from cache.');
      });
      t.true(Date.now() - startTime >= 850, 'It should emit SDK_READY_TIMED_OUT before syncing memberships data with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with memberships data from cache.');
    });
  });

  assert.test(t => { // Testing when we start with cached data but expired (lastUpdate timestamp lower than custom (1) expirationDays ago)
    const CLIENT_READY_MS = 400, CLIENT2_READY_MS = 700, CLIENT3_READY_MS = 1000;

    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheWrapperWithData4',
      events: 'https://events.baseurl/readyFromCacheWrapperWithData4'
    };
    customWrapper.clear();

    fetchMock.get(testUrls.sdk + '/splitChanges?s=1.3&since=-1&rbSince=-1', () => {
      const cache = JSON.parse(customWrapper.getCache()['readyFromCache_4.SPLITIO']);
      t.equal(cache['readyFromCache_4.SPLITIO.hash'], expectedHashNullFilter, 'storage hash must not be changed');
      t.true(nearlyEqual(parseInt(cache['readyFromCache_4.SPLITIO.lastClear'], 10), Date.now()), 'storage lastClear timestamp must be updated');
      t.equal(Object.keys(cache).length, 2, 'feature flags cache data must be cleaned from storage wrapper');
      return { status: 200, body: splitChangesMock1 };
    });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas%40split.io', () => {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: membershipsNicolas, headers: {} }), CLIENT_READY_MS); }); // First client gets segments before splits. No segment cache loading (yet)
    });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas2%40split.io', () => {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'ms': {} }, headers: {} }), CLIENT2_READY_MS); }); // Second client gets segments after 700ms
    });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas3%40split.io', () => {
      return new Promise(res => { setTimeout(() => res({ status: 200, body: { 'ms': {} }, headers: {} }), CLIENT3_READY_MS); }); // Third client memberships will come after 1s
    });
    fetchMock.postOnce(testUrls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(testUrls.events + '/testImpressions/count', 200);

    customWrapper.getCache()['readyFromCache_4.SPLITIO'] = JSON.stringify({
      'readyFromCache_4.SPLITIO.splits.till': '25',
      'readyFromCache_4.SPLITIO.splits.lastUpdated': Date.now() - DEFAULT_CACHE_EXPIRATION_IN_MILLIS / 10 - 1, // -1 to ensure having an expired lastUpdated item
      'readyFromCache_4.SPLITIO.split.always_on': alwaysOnSplitInverted,
      'readyFromCache_4.SPLITIO.hash': expectedHashNullFilter
    });

    const startTime = Date.now();
    const splitio = SplitFactory({
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_4',
        expirationDays: 1,
        wrapper: customWrapper
      },
      startup: {
        readyTimeout: 0.85
      },
      urls: testUrls,
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
      t.true(nearlyEqual(Date.now() - startTime, CLIENT_READY_MS), 'It should emit SDK_READY_FROM_CACHE alongside SDK_READY');
    });
    client2.once(client2.Event.SDK_READY_FROM_CACHE, () => {
      t.true(nearlyEqual(Date.now() - startTime, CLIENT2_READY_MS), 'It should emit SDK_READY_FROM_CACHE alongside SDK_READY');
    });
    client3.once(client3.Event.SDK_READY_FROM_CACHE, () => {
      t.true(nearlyEqual(Date.now() - startTime, CLIENT3_READY_MS), 'It should emit SDK_READY_FROM_CACHE alongside SDK_READY');
    });

    client.on(client.Event.SDK_READY, () => {
      t.true(nearlyEqual(Date.now() - startTime, CLIENT_READY_MS), 'It should emit SDK_READY after syncing with the cloud.');
      t.equal(client.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client.ready().then(() => {
      t.true(nearlyEqual(Date.now() - startTime, CLIENT_READY_MS), 'It should resolve ready promise after syncing with the cloud.');
      t.equal(client.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client2.on(client2.Event.SDK_READY, () => {
      t.true(nearlyEqual(Date.now() - startTime, CLIENT2_READY_MS), 'It should emit SDK_READY after syncing with the cloud.');
      t.equal(client2.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client2.ready().then(() => {
      t.true(nearlyEqual(Date.now() - startTime, CLIENT2_READY_MS), 'It should resolve ready promise after syncing with the cloud.');
      t.equal(client2.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY, () => {
      client3.ready().then(() => {
        t.true(nearlyEqual(Date.now() - startTime, CLIENT3_READY_MS), 'It should resolve ready promise after syncing with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');

        // Last cb: destroy clients and check that storage wrapper has the expected items
        Promise.all([client3.destroy(), client2.destroy(), client.destroy()]).then(() => {
          const cache = JSON.parse(customWrapper.getCache()['readyFromCache_4.SPLITIO']);
          t.equal(cache['readyFromCache_4.SPLITIO.splits.till'], '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
          t.true(nearlyEqual(parseInt(cache['readyFromCache_4.SPLITIO.splits.lastUpdated']), Date.now() - 1000 /* 1000 ms between last Split and memberships fetch */), 'lastUpdated must correspond to the timestamp of the last successfully fetched Splits');

          t.end();
        });
      });
      t.true(Date.now() - startTime >= 1000, 'It should emit SDK_READY after syncing with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
    });
    client3.on(client3.Event.SDK_READY_TIMED_OUT, () => {
      client3.ready().catch(() => {
        t.true(Date.now() - startTime >= 850, 'It should reject ready promise before syncing memberships data with the cloud.');
        t.equal(client3.getTreatment('always_on'), 'control', 'It should not evaluate treatments with memberships data from cache.');
      });
      t.true(Date.now() - startTime >= 850, 'It should emit SDK_READY_TIMED_OUT before syncing memberships data with the cloud.');
      t.equal(client3.getTreatment('always_on'), 'control', 'It should evaluate treatments with memberships data from cache.');
    });
  });

  assert.test(async t => { // Testing clearOnInit config true
    sinon.spy(console, 'log');

    const testUrls = {
      sdk: 'https://sdk.baseurl/readyFromCacheWrapper_10',
      events: 'https://events.baseurl/readyFromCacheWrapper_10'
    };
    const clearOnInitConfig = {
      ...baseConfig,
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'readyFromCache_10',
        clearOnInit: true,
        wrapper: customWrapper
      },
      urls: testUrls,
      debug: true
    };

    // Start with cached data but without lastClear item (JS SDK below 11.1.0) -> cache cleanup
    customWrapper.clear();
    customWrapper.getCache()['readyFromCache_10.SPLITIO'] = JSON.stringify({
      'readyFromCache_10.SPLITIO.splits.till': '25',
      'readyFromCache_10.SPLITIO.split.p1__split': JSON.stringify(splitDeclarations.p1__split),
      'readyFromCache_10.SPLITIO.split.p2__split': JSON.stringify(splitDeclarations.p2__split),
      'readyFromCache_10.SPLITIO.hash': expectedHashNullFilter
    });

    fetchMock.getOnce(testUrls.sdk + '/splitChanges?s=1.3&since=-1&rbSince=-1', { status: 200, body: splitChangesMock1 });
    fetchMock.getOnce(testUrls.sdk + '/splitChanges?s=1.3&since=1457552620999&rbSince=100', { status: 200, body: splitChangesMock2 });
    fetchMock.get(testUrls.sdk + '/memberships/nicolas%40split.io', { status: 200, body: { ms: {} } });

    let splitio = SplitFactory(clearOnInitConfig);
    let client = splitio.client();
    let manager = splitio.manager();

    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.true(client.__getStatus().isReady, 'Client should emit SDK_READY_FROM_CACHE alongside SDK_READY, because clearOnInit is true');
    });

    await client.ready();

    t.true(console.log.calledWithMatch('clearOnInit was set and cache was not cleared in the last 24 hours. Cleaning up cache'), 'It should log a message about cleaning up cache');

    t.equal(manager.names().sort().length, 36, 'active splits should be present for evaluation');

    await splitio.destroy();
    const cache = JSON.parse(customWrapper.getCache()['readyFromCache_10.SPLITIO']);
    t.equal(cache['readyFromCache_10.SPLITIO.splits.till'], '1457552620999', 'splits.till must correspond to the till of the last successfully fetched Splits');
    t.equal(cache['readyFromCache_10.SPLITIO.hash'], expectedHashNullFilter, 'Storage hash must not be changed');
    t.true(nearlyEqual(parseInt(cache['readyFromCache_10.SPLITIO.lastClear']), Date.now()), 'lastClear timestamp must be set');

    // Start again with cached data and lastClear item within the last 24 hours -> no cache cleanup
    console.log.resetHistory();
    fetchMock.getOnce(testUrls.sdk + '/splitChanges?s=1.3&since=1457552620999&rbSince=-1', { status: 200, body: splitChangesMock2 });

    splitio = SplitFactory(clearOnInitConfig);
    client = splitio.client();
    manager = splitio.manager();

    await new Promise(res => client.once(client.Event.SDK_READY_FROM_CACHE, res));

    t.equal(manager.names().sort().length, 36, 'active splits should be present for evaluation');
    t.false(console.log.calledWithMatch('clearOnInit was set and cache was not cleared in the last 24 hours. Cleaning up cache'), 'It should log a message about cleaning up cache');

    await splitio.destroy();

    // Start again with cached data and lastClear item older than 24 hours -> cache cleanup
    console.log.resetHistory();
    customWrapper.getCache()['readyFromCache_10.SPLITIO'] = JSON.stringify({
      ...JSON.parse(customWrapper.getCache()['readyFromCache_10.SPLITIO']),
      'readyFromCache_10.SPLITIO.lastClear': Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
    });
    fetchMock.getOnce(testUrls.sdk + '/splitChanges?s=1.3&since=-1&rbSince=-1', { status: 200, body: splitChangesMock1 });
    fetchMock.getOnce(testUrls.sdk + '/splitChanges?s=1.3&since=1457552620999&rbSince=-1', { status: 200, body: splitChangesMock2 });

    splitio = SplitFactory(clearOnInitConfig);
    client = splitio.client();
    manager = splitio.manager();

    client.once(client.Event.SDK_READY_FROM_CACHE, () => {
      t.true(client.__getStatus().isReady, 'Client should emit SDK_READY_FROM_CACHE alongside SDK_READY, because clearOnInit is true');
    });

    await new Promise(res => client.once(client.Event.SDK_READY, res));

    t.equal(manager.names().sort().length, 36, 'active splits should be present for evaluation');
    t.true(console.log.calledWithMatch('clearOnInit was set and cache was not cleared in the last 24 hours. Cleaning up cache'), 'It should log a message about cleaning up cache');

    await splitio.destroy();

    console.log.restore();
    t.end();
  });

}
