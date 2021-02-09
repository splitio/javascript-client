import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';
import authPushBadToken from '../mocks/auth.pushBadToken.json';
import mySegmentsNicolasMock from '../mocks/mysegments.nicolas@split.io.json';

import { nearlyEqual } from '../testUtils';

import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';

import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

const baseUrls = {
  sdk: 'https://sdk.push-initialization-retries/api',
  events: 'https://events.push-initialization-retries/api',
  auth: 'https://auth.push-initialization-retries/api'
};
const userKey = 'nicolas@split.io';
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: userKey
  },
  scheduler: {
    featuresRefreshRate: 0.2,
    segmentsRefreshRate: 0.2,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000,
    authRetryBackoffBase: 0.1,
    streamingReconnectBackoffBase: 0.1
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  },
  streamingEnabled: true,
  // debug: true,
};
const settings = SettingsFactory(config);

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*) and first auth attempt (fail due to bad token)
 *  0.0 secs: polling (/splitChanges, /mySegments/*)
 *  0.1 secs: second auth attempt (fail due to network error)
 *  0.2 secs: polling (/splitChanges, /mySegments/*)
 *  0.3 secs: third auth attempt (success but push disabled)
 *  0.4 secs: polling (/splitChanges, /mySegments/*)
 */
export function testAuthRetries(fetchMock, assert) {

  let start, splitio, client, ready = false;

  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('first auth attempt');
    return { status: 200, body: authPushBadToken };
  });
  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), { throws: new TypeError('Network error') });
  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    const lapse = Date.now() - start;
    const expected = (settings.scheduler.authRetryBackoffBase * Math.pow(2, 0) + settings.scheduler.authRetryBackoffBase * Math.pow(2, 1));
    assert.true(nearlyEqual(lapse, expected), 'third auth attempt (aproximately in 0.3 seconds from first attempt)');
    return { status: 200, body: authPushDisabled };
  });
  fetchMock.get({ url: settings.url('/mySegments/nicolas%40split.io'), repeat: 4 }, { status: 200, body: mySegmentsNicolasMock });

  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), function () {
    console.log('split changes');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return { status: 200, body: splitChangesMock1 };
  });
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'fallback to polling');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate * 2), 'keep polling since auth success buth with push disabled');
    client.destroy().then(() => {
      assert.end();
    });
    return { status: 200, body: splitChangesMock2 };
  });

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

}

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*), auth success and sse fail
 *  0.0 secs: polling (/splitChanges, /mySegments/*)
 *  0.1 secs: second sse attempt
 *  0.2 secs: polling (/splitChanges, /mySegments/*)
 *  0.3 secs: third sse attempt (success), syncAll (/splitChanges, /mySegments/*)
 */
export function testSSERetries(fetchMock, assert) {
  window.EventSource = EventSourceMock;

  let start, splitio, client, ready = false;
  const expectedTimeToSSEsuccess = (settings.scheduler.streamingReconnectBackoffBase * Math.pow(2, 0) + settings.scheduler.streamingReconnectBackoffBase * Math.pow(2, 1));

  const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true`;
  let sseattempts = 0;
  setMockListener(function (eventSourceInstance) {
    assert.equal(eventSourceInstance.url, expectedSSEurl, 'SSE url is correct');
    if (sseattempts < 2) {
      eventSourceInstance.emitError('some error');
    } else {
      const lapse = Date.now() - start;

      assert.true(nearlyEqual(lapse, expectedTimeToSSEsuccess), 'third auth attempt (aproximately in 0.3 seconds from first attempt)');
      eventSourceInstance.emitOpen();
    }
    sseattempts++;
  });

  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabledNicolas };
  });
  fetchMock.get({ url: settings.url('/mySegments/nicolas%40split.io'), repeat: 4 }, { status: 200, body: mySegmentsNicolasMock });

  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return { status: 200, body: splitChangesMock1 };
  });
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'fallback to polling');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, expectedTimeToSSEsuccess), 'sync due to success SSE connection');
    client.destroy().then(() => {
      assert.end();
    });

    return { status: 200, body: splitChangesMock2 };
  });

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

}

/**
 * Assert that if the main client is destroyed while authentication request is in progress and successes, the SDK doesn't open the SSE connection
 *
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*) and first auth attempt
 *  0.05 secs: client destroyed
 *  0.1 secs: first auth attempt response (success) but not SSE connection opened since push was closed
 *  0.2 secs: test finished
 */
export function testSdkDestroyWhileAuthSuccess(fetchMock, assert) {
  window.EventSource = EventSourceMock;
  setMockListener(function (eventSourceInstance) {
    assert.fail('unexpected EventSource request with url: ' + eventSourceInstance.url);
  });

  let splitio, client, ready = false;

  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), { status: 200, body: authPushEnabledNicolas }, { delay: 100 });

  fetchMock.get({ url: settings.url('/mySegments/nicolas%40split.io'), repeat: 2 }, { status: 200, body: mySegmentsNicolasMock });
  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });

  setTimeout(() => {
    client.destroy().then(() => {
      setTimeout(() => {
        assert.true(ready, 'client was ready before being destroyed');
        assert.end();
      }, 150); // finish the test 50 millis after the third auth attempt would have been done if the client wasn't destroyed
    });
  }, 50); // destroy the client 50 millis before we get a response for the auth request

  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

}

/**
 * Asserts that if the client is destroyed while authentication request is in progress and fails, the SDK doesn't schedule an auth retry
 *
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*) and first auth attempt (fail due to bad token)
 *  0.0 secs: polling (/splitChanges, /mySegments/*)
 *  0.1 secs: second auth attempt request
 *  0.15 secs: client destroyed
 *  0.2 secs: second auth attempt response (fail due to network error)
 *  0.4 secs: NO third auth attempt
 *  0.45 secs: test finished
 */
export function testSdkDestroyWhileAuthRetries(fetchMock, assert) {

  let splitio, client, ready = false;

  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), { status: 200, body: authPushBadToken });
  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), { throws: new TypeError('Network error') }, { delay: 100 });

  fetchMock.get({ url: settings.url('/mySegments/nicolas%40split.io'), repeat: 2 }, { status: 200, body: mySegmentsNicolasMock });
  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  setTimeout(() => {
    client.destroy().then(() => {
      setTimeout(() => {
        assert.true(ready, 'client was ready before being destroyed');
        assert.end();
      }, 300); // finish the test 50 millis after the third auth attempt would have been done if the client wasn't destroyed
    });
  }, 150); // destroy the client 50 millis before we get a response for the second auth attempt

  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

}