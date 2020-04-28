import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552631000.SPLIT_UPDATE.json';
import mySegmentsNicolasMock1 from '../mocks/mysegments.nicolas@split.io.json';
import mySegmentsNicolasMock2 from '../mocks/mysegments.nicolas@split.io.mock2.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552631000.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import mySegmentsUpdateMessage from '../mocks/message.MY_SEGMENTS_UPDATE.nicolas@split.io.1457552640000.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';

import { nearlyEqual } from '../utils';
import Backoff from '../../utils/backoff';

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

const MILLIS_FIRST_SPLIT_UPDATE_EVENT = 200;
const MILLIS_RETRY_FOR_FIRST_SPLIT_UPDATE_EVENT = 300;

const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 400;

const MILLIS_MYSEGMENT_UPDATE_EVENT = 500;
const MILLIS_SECOND_RETRY_FOR_MYSEGMENT_UPDATE_EVENT = 800;

const MILLIS_SPLIT_KILL_EVENT = 900;
const MILLIS_THIRD_RETRY_FOR_SPLIT_KILL_EVENT = 1600;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /mySegments/*)
 *
 *  0.2 secs: SPLIT_UPDATE event -> /splitChanges: bad response -> SDK_UPDATE triggered
 *  0.3 secs: SPLIT_UPDATE event -> /splitChanges retry: success
 *
 *  0.4 secs: SPLIT_UPDATE event with old changeNumber -> SDK_UPDATE not triggered
 *
 *  0.5 secs: MY_SEGMENTS_UPDATE event -> /mySegments/nicolas@split.io: network error
 *  0.6 secs: MY_SEGMENTS_UPDATE event -> /mySegments/nicolas@split.io retry: network error
 *  0.8 secs: MY_SEGMENTS_UPDATE event -> /mySegments/nicolas@split.io retry: success -> SDK_UPDATE triggered
 *
 *  0.9 secs: SPLIT_KILL event -> /splitChanges: bad response -> SDK_UPDATE triggered although fetches fail
 *  1.0 secs: SPLIT_KILL event -> /splitChanges retry: network error
 *  1.2 secs: SPLIT_KILL event -> /splitChanges retry: network error
 *  1.6 secs: SPLIT_KILL event -> /splitChanges retry: 408 request timeout
 *    (we destroy the client here, to assert that all scheduled tasks are clean)
 */
export function testSynchronizationRetries(mock, assert) {
  // we update the backoff default base, to reduce the time of the test
  const ORIGINAL_DEFAULT_BASE_MILLIS = Backoff.DEFAULT_BASE_MILLIS;
  Backoff.DEFAULT_BASE_MILLIS = 100;

  assert.plan(17);
  mock.reset();

  let start;

  const splitio = SplitFactory(config);
  const client = splitio.client();

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    start = Date.now();

    const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true`;
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
        assert.true(nearlyEqual(lapse, MILLIS_SECOND_RETRY_FOR_MYSEGMENT_UPDATE_EVENT), 'SDK_UPDATE due to MY_SEGMENTS_UPDATE event');
        assert.equal(client.getTreatment('splitters'), 'on', 'evaluation with updated MySegments list');
      });
      eventSourceInstance.emitMessage(mySegmentsUpdateMessage);
    }, MILLIS_MYSEGMENT_UPDATE_EVENT); // send a MY_SEGMENTS_UPDATE event with a new changeNumber after 0.4 seconds

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
    }, MILLIS_SPLIT_KILL_EVENT); // send a SPLIT_KILL event with a new changeNumber after 0.5 seconds

  });

  // initial auth
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabledNicolas];
  });

  // initial split and mySegments sync
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(200, splitChangesMock1);
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // split and segment sync after SSE opened
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN), 'sync after SSE connection is opened');
    return [200, splitChangesMock2];
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // fetch due to SPLIT_UPDATE event
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, splitChangesMock2);
  // fetch retry for SPLIT_UPDATE event, due to previous unexpected response (response till minor than SPLIT_UPDATE changeNumber)
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_RETRY_FOR_FIRST_SPLIT_UPDATE_EVENT), 'fetch retry due to SPLIT_UPDATE event');
    return [200, splitChangesMock3];
  });

  // fetch due to first MY_SEGMENTS_UPDATE event
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).networkErrorOnce();
  // fetch retry for MY_SEGMENTS_UPDATE event, due to previous fail
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).networkErrorOnce();
  // second fetch retry for MY_SEGMENTS_UPDATE event, due to previous fail
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SECOND_RETRY_FOR_MYSEGMENT_UPDATE_EVENT), 'sync second retry for MY_SEGMENTS_UPDATE event');
    return [200, mySegmentsNicolasMock2];
  });

  // fetch due to SPLIT_KILL event
  mock.onGet(settings.url('/splitChanges?since=1457552631000')).replyOnce(function () {
    assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation with split killed immediately, before fetch is done');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'sync due to SPLIT_KILL event');
    return [200, { since: 1457552631000, till: 1457552631000, splits: [] }]; // returning old state
  });
  // first fetch retry for SPLIT_KILL event, due to previous unexpected response (response till minor than SPLIT_KILL changeNumber)
  mock.onGet(settings.url('/splitChanges?since=1457552631000')).networkErrorOnce();
  // second fetch retry for SPLIT_KILL event
  mock.onGet(settings.url('/splitChanges?since=1457552631000')).networkErrorOnce();
  // third fetch retry for SPLIT_KILL event
  mock.onGet(settings.url('/splitChanges?since=1457552631000')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_THIRD_RETRY_FOR_SPLIT_KILL_EVENT), 'third fetch retry due to SPLIT_KILL event');

    setTimeout(() => {
      client.destroy().then(() => {
        assert.equal(client.getTreatment('whitelist'), 'control', 'evaluation returns control if client is destroyed');
        Backoff.DEFAULT_BASE_MILLIS = ORIGINAL_DEFAULT_BASE_MILLIS;
        assert.end();
      });
    });

    return [408, 'request timeout'];
  });

  mock.onGet(new RegExp('.*')).reply(function (request) {
    assert.fail('unexpected GET request with url: ' + request.url);
  });
}