import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolasMock1 from '../mocks/mysegments.nicolas@split.io.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.601secs.json';

import { nearlyEqual } from '../utils';

// Replace original EventSource with mock
import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';
window.EventSource = EventSourceMock;

import { SplitFactory } from '../../index';
import SettingsFactory from '../../utils/settings';

const userKey = 'nicolas@split.io';

const baseUrls = {
  sdk: 'https://sdk.push-synchronization/api',
  events: 'https://events.push-synchronization/api',
  auth: 'https://auth.push-synchronization/api'
};
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: userKey
  },
  urls: baseUrls,
  streamingEnabled: true,
  // debug: true,
};
const settings = SettingsFactory(config);

const MILLIS_SSE_OPEN = 100;
const MILLIS_REFRESH_TOKEN = 1000;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth, SSE connection -> refresh token scheduled in 1 second.
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /segmentChanges/*)
 *  1.0 secs: refresh-token: reauth, SSE connection
 *  1.2 secs: SSE connection reopened -> syncAll (/splitChanges, /segmentChanges/*)
 */
export function testRefreshToken(mock, assert) {
  mock.reset();

  const start = Date.now();

  const splitio = SplitFactory(config);
  const client = splitio.client();

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

  });

  // initial sync
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(200, splitChangesMock1);
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // first auth
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabledNicolas];
  });

  // sync after SSE opened
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, splitChangesMock2);
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // re-auth due to refresh token
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN), 'reauthentication for token refresh');
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    return [200, authPushEnabledNicolas];
  });

  // sync after SSE reopened
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN + MILLIS_SSE_OPEN), 'sync after SSE connection is reopened');
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // second re-auth due to refresh token
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN * 2), 'second reauthentication for token refresh');
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    return [200, authPushEnabledNicolas];
  });

  // split sync after SSE reopened
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN * 2 + MILLIS_SSE_OPEN), 'sync after SSE connection is reopened a second time');
    client.destroy().then(() => {
      assert.end();
    });
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  mock.onGet(new RegExp('.*')).reply(function (request) {
    assert.fail('unexpected GET request with url: ' + request.url);
  });
}