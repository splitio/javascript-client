import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authPushEnabled from '../mocks/auth.pushEnabled.node.json';
import authPushBadToken from '../mocks/auth.pushBadToken.json';

import { nearlyEqual, url } from '../testUtils';

import EventSourceMock, { setMockListener } from '../testUtils/eventSourceMock';
import { __setEventSource } from '../../platform/getEventSource/node';

import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const baseUrls = {
  sdk: 'https://sdk.push-initialization-retries/api',
  events: 'https://events.push-initialization-retries/api',
  auth: 'https://auth.push-initialization-retries/api'
};
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>'
  },
  scheduler: {
    featuresRefreshRate: 0.2,
    segmentsRefreshRate: 0.2,
    pushRetryBackoffBase: 0.1
  },
  urls: baseUrls,
  streamingEnabled: true,
  // debug: true,
};
const settings = settingsFactory(config);

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*) and first auth attempt (fail due to bad token)
 *  0.0 secs: polling (/splitChanges, /segmentChanges/*)
 *  0.1 secs: second push connect attempt (auth fail due to network error)
 *  0.2 secs: polling (/splitChanges, /segmentChanges/*)
 *  0.3 secs: third push connect attempt (auth success but push disabled)
 *  0.4 secs: polling (/splitChanges, /segmentChanges/*)
 */
export function testPushRetriesDueToAuthErrors(fetchMock, assert) {

  let start, splitio, client, ready = false;

  fetchMock.getOnce(url(settings, '/v2/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('first auth attempt');
    return { status: 200, body: authPushBadToken };
  });
  fetchMock.getOnce(url(settings, '/v2/auth'), { throws: new TypeError('Network error') });
  fetchMock.getOnce(url(settings, '/v2/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    const lapse = Date.now() - start;
    const expected = (settings.scheduler.pushRetryBackoffBase * Math.pow(2, 0) + settings.scheduler.pushRetryBackoffBase * Math.pow(2, 1));
    assert.true(nearlyEqual(lapse, expected), 'third auth attempt (aproximately in 0.3 seconds from first attempt)');
    return { status: 200, body: authPushDisabled };
  });
  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=-1'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return { status: 200, body: splitChangesMock1 };
  });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'fallback to polling');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function () {
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
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth successes and sse fails
 *  0.1 secs: second push connect attempt (auth successes and sse fails again)
 *  0.2 secs: polling (/splitChanges, /segmentChanges/*)
 *  0.3 secs: third push connect attempt (auth and sse success), syncAll (/splitChanges, /segmentChanges/*)
 */
export function testPushRetriesDueToSseErrors(fetchMock, assert) {
  __setEventSource(EventSourceMock);

  let start, splitio, client, ready = false;
  const expectedTimeToSSEsuccess = (settings.scheduler.pushRetryBackoffBase * Math.pow(2, 0) + settings.scheduler.pushRetryBackoffBase * Math.pow(2, 1));

  const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_segments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabled.token}&v=1.1&heartbeats=true`;
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

  fetchMock.get({ url: url(settings, '/v2/auth'), repeat: 3 /* 3 push attempts */ }, function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabled };
  });
  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=-1'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return { status: 200, body: splitChangesMock1 };
  });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'fallback to polling');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function () {
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
  __setEventSource(EventSourceMock);
  setMockListener(function (eventSourceInstance) {
    assert.fail('unexpected EventSource request with url: ' + eventSourceInstance.url);
  });

  let splitio, client, ready = false;

  fetchMock.getOnce(url(settings, '/v2/auth'), { status: 200, body: authPushEnabled }, { delay: 100 });

  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=-1'), { status: 200, body: splitChangesMock1 });

  setTimeout(() => {
    client.destroy().then(() => {
      setTimeout(() => {
        assert.true(ready, 'client was ready before being destroyed');
        assert.end();
      }, 150); // finish the test after auth success
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

  fetchMock.getOnce(url(settings, '/v2/auth'), { status: 200, body: authPushBadToken });
  fetchMock.getOnce(url(settings, '/v2/auth'), { throws: new TypeError('Network error') }, { delay: 100 });

  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), { status: 200, body: splitChangesMock2 });

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
