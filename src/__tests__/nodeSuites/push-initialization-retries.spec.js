import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authPushEnabled from '../mocks/auth.pushEnabled.node.json';
import authPushBadToken from '../mocks/auth.pushBadToken.json';

import { nearlyEqual } from '../testUtils';

import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';
import { __setEventSource } from '../../services/getEventSource/node';

import { SplitFactory } from '../../index';
import SettingsFactory from '../../utils/settings';

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
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*) and first auth attempt (fail due to bad token)
 *  0.0 secs: polling (/splitChanges, /segmentChanges/*)
 *  0.1 secs: second auth attempt (fail due to network error)
 *  0.2 secs: polling (/splitChanges, /segmentChanges/*)
 *  0.3 secs: third auth attempt (success but push disabled)
 *  0.4 secs: polling (/splitChanges, /segmentChanges/*)
 */
export function testAuthRetries(fetchMock, assert) {

  let start, splitio, client, ready = false;

  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('first auth attempt');
    return { status: 200, body: authPushBadToken };
  });
  fetchMock.getOnce(settings.url('/auth'), { throws: new TypeError('Network error') });
  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    const lapse = Date.now() - start;
    const expected = (settings.scheduler.authRetryBackoffBase * Math.pow(2, 0) + settings.scheduler.authRetryBackoffBase * Math.pow(2, 1));
    assert.true(nearlyEqual(lapse, expected), 'third auth attempt (aproximately in 0.3 seconds from first attempt)');
    return { status: 200, body: authPushDisabled };
  });
  fetchMock.get(new RegExp(`${settings.url('/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

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
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth success and sse fail
 *  0.1 secs: second sse attempt
 *  0.2 secs: polling (/splitChanges, /segmentChanges/*)
 *  0.3 secs: third sse attempt (success), syncAll (/splitChanges, /segmentChanges/*)
 */
export function testSSERetries(fetchMock, assert) {
  __setEventSource(EventSourceMock);

  let start, splitio, client, ready = false;
  const expectedTimeToSSEsuccess = (settings.scheduler.streamingReconnectBackoffBase * Math.pow(2, 0) + settings.scheduler.streamingReconnectBackoffBase * Math.pow(2, 1));

  const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_segments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabled.token}&v=1.1&heartbeats=true`;
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

  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabled };
  });
  fetchMock.get(new RegExp(`${settings.url('/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

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