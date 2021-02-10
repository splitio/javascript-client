import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';

import authPushEnabled from '../mocks/auth.pushEnabled.node.601secs.json';

import { nearlyEqual, mockSegmentChanges } from '../testUtils';

import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';
import { __setEventSource } from '../../services/getEventSource/node';

import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

const key = 'nicolas@split.io';

const baseUrls = {
  sdk: 'https://sdk.push-synchronization/api',
  events: 'https://events.push-synchronization/api',
  auth: 'https://auth.push-synchronization/api'
};
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>'
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
export function testRefreshToken(fetchMock, assert) {
  fetchMock.reset();
  __setEventSource(EventSourceMock);

  let start, splitio, client;

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_segments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabled.token}&v=1.1&heartbeats=true`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

  });

  // initial split sync
  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });

  // first auth
  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabled };
  });

  // split sync after SSE opened
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });

  // re-auth due to refresh token
  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN), 'reauthentication for token refresh');
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    return { status: 200, body: authPushEnabled };
  });

  // split sync after SSE reopened
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN + MILLIS_SSE_OPEN), 'sync after SSE connection is reopened');
    return { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } };
  });

  // second re-auth due to refresh token
  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN * 2), 'second reauthentication for token refresh');
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    return { status: 200, body: authPushEnabled };
  });

  // split sync after SSE reopened
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN * 2 + MILLIS_SSE_OPEN), 'sync after SSE connection is reopened a second time');
    client.destroy().then(() => {
      assert.end();
    });
    return { status: 500, body: 'server error' };
  });

  mockSegmentChanges(fetchMock, new RegExp(`${settings.url('/segmentChanges')}/*`), [key]);

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();

}