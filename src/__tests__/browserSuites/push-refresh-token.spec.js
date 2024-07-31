import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolasMock1 from '../mocks/mysegments.nicolas@split.io.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.601secs.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';

import { nearlyEqual, url } from '../testUtils';

// Replace global EventSource with mock
import EventSourceMock, { setMockListener } from '../testUtils/eventSourceMock';
window.EventSource = EventSourceMock;

import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const userKey = 'nicolas@split.io';

const baseUrls = {
  sdk: 'https://sdk.push-refresh-token/api',
  events: 'https://events.push-refresh-token/api',
  auth: 'https://auth.push-refresh-token/api'
};
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: userKey
  },
  urls: baseUrls,
  streamingEnabled: true,
  scheduler: {
    pushRetryBackoffBase: 0.01 // small value to assert rapidly that push is not retried after auth with push disabled
  },
  // debug: true,
};
const settings = settingsFactory(config);

const MILLIS_CONNDELAY = 500;
const MILLIS_REFRESH_TOKEN = 1000;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll, auth, and not delayed SSE connection -> refresh token in 1 second, connection delay 0 seconds
 *  1.0 secs: refresh-token: reauth -> refresh token in 1 second, connection delay 0.5 seconds
 *  1.5 secs: delayed SSE connection -> syncAll
 *  2.0 secs: refresh-token: reauth with pushEnabled false --> SSE connection closed & syncAll
 *  2.2 secs: destroy the client. NO NEW REQUESTS SHOULD HAVE BEEN PERFORMED (too early for polling and push is disabled)
 */
export function testRefreshToken(fetchMock, assert) {
  fetchMock.reset();

  let start, splitio, client;

  // mock SSE open and message events
  let sseCount = 0;
  setMockListener(function (eventSourceInstance) {
    sseCount++;
    switch (sseCount) {
      case 1:
        assert.true(nearlyEqual(Date.now() - start, 0), 'first connection is created immediately');
        break;
      case 2:
        assert.true(nearlyEqual(Date.now() - start, MILLIS_REFRESH_TOKEN + MILLIS_CONNDELAY), 'second connection is created with a delay');
        break;
      default:
        assert.fail('expecting only 2 SSE connections');
    }

    const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true&SplitSDKVersion=${settings.version}&SplitSDKClientKey=h-1>`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    eventSourceInstance.emitOpen();

    setTimeout(() => {
      assert.equal(eventSourceInstance.readyState, EventSourceMock.CLOSED, 'SSE connection must be closed');
    }, MILLIS_REFRESH_TOKEN + MILLIS_CONNDELAY + 50); // after refreshing the token and creating a new connection, previous connection is closed
  });

  // initial sync
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });

  // first auth
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.2&users=${encodeURIComponent(userKey)}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabledNicolas };
  });

  // sync after SSE opened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });

  // re-auth due to refresh token, with connDelay of 0.5 seconds
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.2&users=${encodeURIComponent(userKey)}`), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN), 'reauthentication for token refresh');
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    return { status: 200, body: { ...authPushEnabledNicolas, connDelay: MILLIS_CONNDELAY / 1000 } };
  });

  // sync after SSE reopened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN + MILLIS_CONNDELAY), 'sync after SSE connection is reopened');
    return { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } };
  });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });

  // second re-auth due to refresh token, this time responding with pushEnabled false
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.2&users=${encodeURIComponent(userKey)}`), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN * 2), 'second reauthentication for token refresh');
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    return { status: 200, body: authPushDisabled };
  });

  // split sync after SSE closed due to push disabled
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_REFRESH_TOKEN * 2), 'sync after SSE connection is reopened a second time');
    setTimeout(() => {
      client.destroy().then(() => {
        assert.end();
      });
    }, 200); // destroy the client a little bit latter, to assert that there weren't new requests
    return { status: 500, body: 'server error' };
  });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();

}
