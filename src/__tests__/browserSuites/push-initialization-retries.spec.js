import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';
import mySegmentsNicolasMock from '../mocks/mysegments.nicolas@split.io.json';

import { nearlyEqual } from '../utils';

import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';

import { SplitFactory } from '../../index';
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
    key: userKey,
  },
  scheduler: {
    featuresRefreshRate: 0.2,
    segmentsRefreshRate: 0.2,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  },
  streamingEnabled: true,
  authRetryBackoffBase: 0.1,
  streamingReconnectBackoffBase: 0.1,
  // debug: true,
};
const settings = SettingsFactory(config);

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*) and first auth attempt
 *  0.1 secs: second auth attempt
 *  0.2 secs: polling (/splitChanges, /mySegments/*)
 *  0.3 secs: third auth attempt (success but push disabled)
 *  0.4 secs: polling (/splitChanges, /mySegments/*)
 */
export function testAuthRetries(mock, assert) {

  const start = Date.now();

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let ready = false;
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).timeoutOnce();
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).networkErrorOnce();
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    const lapse = Date.now() - start;
    const expected = (settings.authRetryBackoffBase * Math.pow(2, 0) + settings.authRetryBackoffBase * Math.pow(2, 1));
    assert.true(nearlyEqual(lapse, expected), 'third auth attempt (aproximately in 0.3 seconds from first attempt)');
    return [200, authPushDisabled];
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).reply(200, mySegmentsNicolasMock);

  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return [200, splitChangesMock1];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling');
    return [200, splitChangesMock2];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate * 2), 'keep polling since auth success buth with push disabled');
    client.destroy().then(() => {
      assert.end();
    });
    return [200, splitChangesMock2];
  });

}

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*), auth success and sse fail
 *  0.1 secs: second sse attempt
 *  0.2 secs: polling (/splitChanges, /mySegments/*)
 *  0.3 secs: third sse attempt (success), syncAll (/splitChanges, /mySegments/*)
 */
export function testSSERetries(mock, assert) {
  window.EventSource = EventSourceMock;

  const start = Date.now();
  const expectedTimeToSSEsuccess = (settings.streamingReconnectBackoffBase * Math.pow(2, 0) + settings.streamingReconnectBackoffBase * Math.pow(2, 1));

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let ready = false;
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

  const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true`;
  let sseattempts = 0;
  setMockListener(function (eventSourceInstance) {
    assert.equal(eventSourceInstance.url, expectedSSEurl, 'SSE url is correct');
    if (sseattempts < 2) {
      eventSourceInstance.emitError({ type: 'error' });
    } else {
      const lapse = Date.now() - start;

      assert.true(nearlyEqual(lapse, expectedTimeToSSEsuccess), 'third auth attempt (aproximately in 0.3 seconds from first attempt)');
      eventSourceInstance.emitOpen();
    }
    sseattempts++;
  });

  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabledNicolas];
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).reply(200, mySegmentsNicolasMock);

  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return [200, splitChangesMock1];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling');
    return [200, splitChangesMock2];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, expectedTimeToSSEsuccess), 'sync due to success SSE connection');
    client.destroy().then(() => {
      assert.end();
    });

    return [200, splitChangesMock2];
  });

}