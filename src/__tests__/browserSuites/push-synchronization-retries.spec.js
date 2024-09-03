import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552649999.SPLIT_UPDATE.json';
import membershipsNicolasMock1 from '../mocks/memberships.nicolas@split.io.json';
import membershipsNicolasMock2 from '../mocks/memberships.nicolas@split.io.mock2.json';
import membershipsMarcio from '../mocks/memberships.marcio@split.io.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552649999.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import mySegmentsUpdateMessage from '../mocks/message.MEMBERSHIPS_MS_UPDATE.UNBOUNDED.1457552640000.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';

import { nearlyEqual, url } from '../testUtils';
import { Backoff } from '@splitsoftware/splitio-commons/src/utils/Backoff';

// Replace original EventSource with mock
import EventSourceMock, { setMockListener } from '../testUtils/eventSourceMock';
window.EventSource = EventSourceMock;

import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const userKey = 'nicolas@split.io';
const otherUserKeySync = 'marcio@split.io';

const baseUrls = {
  sdk: 'https://sdk.push-synchronization-retries/api',
  events: 'https://events.push-synchronization-retries/api',
  auth: 'https://auth.push-synchronization-retries/api'
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
const settings = settingsFactory(config);

const MILLIS_SSE_OPEN = 100;

const MILLIS_FIRST_SPLIT_UPDATE_EVENT = 200;
const MILLIS_RETRY_FOR_FIRST_SPLIT_UPDATE_EVENT = 300;

const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 400;

const MILLIS_MEMBERSHIPS_MS_UPDATE = 500;
const MILLIS_THIRD_RETRY_FOR_MEMBERSHIPS_MS_UPDATE = 1200;

const MILLIS_SPLIT_KILL_EVENT = 1300;
const MILLIS_THIRD_RETRY_FOR_SPLIT_KILL_EVENT = 2000;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /memberships/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /memberships/*)
 *
 *  0.2 secs: SPLIT_UPDATE event -> /splitChanges: bad response -> SDK_UPDATE triggered
 *  0.3 secs: SPLIT_UPDATE event -> /splitChanges retry: success
 *
 *  0.4 secs: SPLIT_UPDATE event with old changeNumber -> SDK_UPDATE not triggered
 *
 *  0.5 secs: Unbounded MEMBERSHIPS_MS_UPDATE event -> /memberships/marcio@split.io OK, /memberships/nicolas@split.io: network error
 *  0.6 secs: Unbounded MEMBERSHIPS_MS_UPDATE event -> /memberships/nicolas@split.io retry: invalid JSON response
 *  0.8 secs: Unbounded MEMBERSHIPS_MS_UPDATE event -> /memberships/nicolas@split.io: server error
 *  1.2 secs: Unbounded MEMBERSHIPS_MS_UPDATE event -> /memberships/nicolas@split.io retry: success -> SDK_UPDATE triggered
 *
 *  1.3 secs: SPLIT_KILL event -> /splitChanges: outdated response -> SDK_UPDATE triggered although fetches fail
 *  1.4 secs: SPLIT_KILL event -> /splitChanges retry: network error
 *  1.6 secs: SPLIT_KILL event -> /splitChanges retry: invalid JSON response
 *  2.0 secs: SPLIT_KILL event -> /splitChanges retry: 408 request timeout
 *    (we destroy the client here, to assert that all scheduled tasks are clean)
 */
export function testSynchronizationRetries(fetchMock, assert) {
  // Force the backoff base of UpdateWorkers, from 10 secs to 100 ms, to reduce test time
  Backoff.__TEST__BASE_MILLIS = 100;

  assert.plan(17);
  fetchMock.reset();

  let start, splitio, client, otherClientSync;

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    start = Date.now();

    const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_control,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_flags,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_memberships,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true&SplitSDKVersion=${settings.version}&SplitSDKClientKey=h-1>`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    /* events on first SSE connection */
    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

    setTimeout(() => {
      assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation of initial Split');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_RETRY_FOR_FIRST_SPLIT_UPDATE_EVENT), 'SDK_UPDATE due to SPLIT_UPDATE event');
        assert.equal(client.getTreatment('whitelist'), 'allowed', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(splitUpdateMessage);
    }, MILLIS_FIRST_SPLIT_UPDATE_EVENT); // send a SPLIT_UPDATE event with a new changeNumber after 0.2 seconds

    setTimeout(() => {
      eventSourceInstance.emitMessage(oldSplitUpdateMessage);
    }, MILLIS_SECOND_SPLIT_UPDATE_EVENT); // send a SPLIT_UPDATE event with an old changeNumber after 0.3 seconds

    setTimeout(() => {
      assert.equal(client.getTreatment('splitters'), 'off', 'evaluation with initial MySegments list');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_THIRD_RETRY_FOR_MEMBERSHIPS_MS_UPDATE), 'SDK_UPDATE due to MEMBERSHIPS_MS_UPDATE event');
        assert.equal(client.getTreatment('splitters'), 'on', 'evaluation with updated MySegments list');
      });
      eventSourceInstance.emitMessage(mySegmentsUpdateMessage);
    }, MILLIS_MEMBERSHIPS_MS_UPDATE); // send a MEMBERSHIPS_MS_UPDATE event with a new changeNumber after 0.4 seconds

    setTimeout(() => {
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'SDK_UPDATE due to SPLIT_KILL event');
        assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation with killed Split. SDK_UPDATE event must be triggered only once due to SPLIT_KILL, even if fetches fail.');
        client.once(client.Event.SDK_UPDATE, () => {
          assert.fail('SDK_UPDATE event must not be triggered again');
        });
      });
      eventSourceInstance.emitMessage(splitKillMessage);
    }, MILLIS_SPLIT_KILL_EVENT); // send a SPLIT_KILL event with a new changeNumber after 1.3 seconds

  });

  // initial auth
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.2&users=${encodeURIComponent(userKey)}&users=${encodeURIComponent(otherUserKeySync)}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabledNicolas };
  });

  // initial split and memberships sync
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), { status: 200, body: membershipsNicolasMock1 });
  fetchMock.get({ url: url(settings, '/memberships/marcio%40split.io'), repeat: 3 }, { status: 200, body: membershipsMarcio });

  // split and segment sync after SSE opened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN), 'sync after SSE connection is opened');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), { status: 200, body: membershipsNicolasMock1 });

  // fetch due to SPLIT_UPDATE event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), { status: 200, body: splitChangesMock2 });
  // fetch retry for SPLIT_UPDATE event, due to previous unexpected response (response till minor than SPLIT_UPDATE changeNumber)
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_RETRY_FOR_FIRST_SPLIT_UPDATE_EVENT), 'fetch retry due to SPLIT_UPDATE event');
    return { status: 200, body: splitChangesMock3 };
  });

  // fetch due to first MEMBERSHIPS_MS_UPDATE event
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), { throws: new TypeError('Network error') });
  // fetch retry for MEMBERSHIPS_MS_UPDATE event, due to previous fail
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), { status: 200, body: '{ "since": 1457552620999, "til' }); // invalid JSON response
  // fetch retry for MEMBERSHIPS_MS_UPDATE event, due to previous fail
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), { status: 500, body: 'server error' });
  // second fetch retry for MEMBERSHIPS_MS_UPDATE event, due to previous fail
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_THIRD_RETRY_FOR_MEMBERSHIPS_MS_UPDATE), 'sync second retry for MEMBERSHIPS_MS_UPDATE event');
    return { status: 200, body: membershipsNicolasMock2 };
  });

  // fetch due to SPLIT_KILL event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552649999'), function () {
    assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation with split killed immediately, before fetch is done');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'sync due to SPLIT_KILL event');
    return { status: 200, body: { since: 1457552649999, till: 1457552649999, splits: [] } }; // returning old state
  });
  // first fetch retry for SPLIT_KILL event, due to previous unexpected response (response till minor than SPLIT_KILL changeNumber)
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552649999'), { throws: new TypeError('Network error') });
  // second fetch retry for SPLIT_KILL event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552649999'), { status: 200, body: '{ "since": 1457552620999, "til' }); // invalid JSON response
  // third fetch retry for SPLIT_KILL event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552649999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_THIRD_RETRY_FOR_SPLIT_KILL_EVENT), 'third fetch retry due to SPLIT_KILL event');

    setTimeout(() => {
      Promise.all([otherClientSync.destroy(), client.destroy()]).then(() => {
        assert.equal(client.getTreatment('whitelist'), 'control', 'evaluation returns control if client is destroyed');
        Backoff.__TEST__BASE_MILLIS = undefined;
        assert.end();
      });
    });

    return { status: 408, body: 'request timeout' };
  });

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  fetchMock.post('*', 200);

  splitio = SplitFactory(config);
  client = splitio.client();
  otherClientSync = splitio.client(otherUserKeySync);

}
