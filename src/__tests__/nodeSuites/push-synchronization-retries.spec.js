import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552649999.SPLIT_UPDATE.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552649999.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import segmentUpdateMessage from '../mocks/message.SEGMENT_UPDATE.1457552640000.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';

import authPushEnabled from '../mocks/auth.pushEnabled.node.json';

import { nearlyEqual, mockSegmentChanges } from '../utils';
import Backoff from '../../utils/backoff';

import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';
import { __setEventSource } from '../../services/getEventSource/node';

import { SplitFactory } from '../../index';
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

const MILLIS_FIRST_SPLIT_UPDATE_EVENT = 200;
const MILLIS_RETRY_FOR_FIRST_SPLIT_UPDATE_EVENT = 300;

const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 400;

const MILLIS_SEGMENT_UPDATE_EVENT = 500;
const MILLIS_SECOND_RETRY_FOR_SEGMENT_UPDATE_EVENT = 800;

const MILLIS_SPLIT_KILL_EVENT = 900;
const MILLIS_THIRD_RETRY_FOR_SPLIT_KILL_EVENT = 1600;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /segmentChanges/*)
 *
 *  0.2 secs: SPLIT_UPDATE event -> /splitChanges: network error
 *  0.3 secs: SPLIT_UPDATE event -> /splitChanges retry: success -> SDK_UPDATE triggered
 *
 *  0.4 secs: SPLIT_UPDATE event with old changeNumber -> SDK_UPDATE not triggered
 *
 *  0.5 secs: SEGMENT_UPDATE event -> /segmentChanges/*: bad response
 *  0.6 secs: SEGMENT_UPDATE event -> /segmentChanges/* retry: network error
 *  0.8 secs: SEGMENT_UPDATE event -> /segmentChanges/* retry: success -> SDK_UPDATE triggered
 *
 *  0.9 secs: SPLIT_KILL event -> /splitChanges: bad response -> SDK_UPDATE triggered although fetches fail
 *  1.0 secs: SPLIT_KILL event -> /splitChanges retry: network error
 *  1.2 secs: SPLIT_KILL event -> /splitChanges retry: network error
 *  1.6 secs: SPLIT_KILL event -> /splitChanges retry: 408 request timeout
 *    (we destroy the client here, to assert that all scheduled tasks are clean)
 */
export function testSynchronizationRetries(fetchMock, assert) {
  // we update the backoff default base, to reduce the time of the test
  const ORIGINAL_DEFAULT_BASE_MILLIS = Backoff.DEFAULT_BASE_MILLIS;
  Backoff.DEFAULT_BASE_MILLIS = 100;

  assert.plan(19);
  fetchMock.reset();
  __setEventSource(EventSourceMock);

  let start, splitio, client;

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    start = Date.now();

    const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_segments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabled.token}&v=1.1&heartbeats=true`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation of initial Split');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_RETRY_FOR_FIRST_SPLIT_UPDATE_EVENT), 'SDK_UPDATE due to SPLIT_UPDATE event');
        assert.equal(client.getTreatment(key, 'whitelist'), 'allowed', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(splitUpdateMessage);
    }, MILLIS_FIRST_SPLIT_UPDATE_EVENT); // send a SPLIT_UPDATE event with a new changeNumber after 0.2 seconds
    setTimeout(() => {
      eventSourceInstance.emitMessage(oldSplitUpdateMessage);
    }, MILLIS_SECOND_SPLIT_UPDATE_EVENT); // send a SPLIT_UPDATE event with an old changeNumber after 0.3 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'splitters'), 'on', 'evaluation with initial segment');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_SECOND_RETRY_FOR_SEGMENT_UPDATE_EVENT), 'SDK_UPDATE due to SEGMENT_UPDATE event');
        assert.equal(client.getTreatment(key, 'splitters'), 'off', 'evaluation with updated segment');
      });
      eventSourceInstance.emitMessage(segmentUpdateMessage);
    }, MILLIS_SEGMENT_UPDATE_EVENT); // send a SEGMENT_UPDATE event with a new changeNumber after 0.4 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'whitelist'), 'allowed', 'evaluation with not killed Split');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'SDK_UPDATE due to SPLIT_KILL event');
        assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation with killed Split. SDK_UPDATE event must be triggered only once due to SPLIT_KILL, even if fetches fail.');
        client.once(client.Event.SDK_UPDATE, () => {
          assert.fail('SDK_UPDATE event must not be triggered again');
        });
      });
      eventSourceInstance.emitMessage(splitKillMessage);
    }, MILLIS_SPLIT_KILL_EVENT); // send a SPLIT_KILL event with a new changeNumber after 0.5 seconds

  });

  // initial auth
  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabled };
  });

  // initial split and segment sync
  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(settings.url('/segmentChanges/splitters?since=-1'),
    { status: 200, body: { since: -1, till: 1457552620999, name: 'splitters', added: [key], removed: [] } }
  );
  // extra retry due to double request (greedy fetch). @TODO: remove once `SplitChangesUpdaterFactory` and `segmentChangesFetcher` are updated
  fetchMock.getOnce(settings.url('/segmentChanges/splitters?since=1457552620999'),
    { status: 200, body: { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] } }
  );

  // split and segment sync after SSE opened
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN), 'sync after SSE connection is opened');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(settings.url('/segmentChanges/splitters?since=1457552620999'),
    { status: 200, body: { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] } }
  );

  // fetch due to SPLIT_UPDATE event
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), { throws: new TypeError('Network error') });
  // fetch retry for SPLIT_UPDATE event, due to previous fail
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_RETRY_FOR_FIRST_SPLIT_UPDATE_EVENT), 'fetch retry due to SPLIT_UPDATE event');
    return { status: 200, body: splitChangesMock3 };
  });

  // fetch due to SEGMENT_UPDATE event
  fetchMock.getOnce(settings.url('/segmentChanges/splitters?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SEGMENT_UPDATE_EVENT), 'sync due to SEGMENT_UPDATE event');
    return { status: 200, body: { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] } };
  });
  // first fetch retry for SEGMENT_UPDATE event, due to previous unexpected response (response till minor than SEGMENT_UPDATE changeNumber)
  fetchMock.getOnce(settings.url('/segmentChanges/splitters?since=1457552620999'), { throws: new TypeError('Network error') });
  // second fetch retry for SEGMENT_UPDATE event, due to previous network error
  fetchMock.getOnce(settings.url('/segmentChanges/splitters?since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SECOND_RETRY_FOR_SEGMENT_UPDATE_EVENT), 'sync second retry for SEGMENT_UPDATE event');
    return { status: 200, body: { since: 1457552620999, till: 1457552640000, name: 'splitters', added: [], removed: [key] } };
  });
  // extra retry (fetch until since === till)
  fetchMock.getOnce(settings.url('/segmentChanges/splitters?since=1457552640000'), { status: 200, body: { since: 1457552640000, till: 1457552640000, name: 'splitters', added: [], removed: [] } });

  // fetch due to SPLIT_KILL event
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552649999'), function () {
    assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation with split killed immediately, before fetch is done');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'sync due to SPLIT_KILL event');
    return { status: 200, body: { since: 1457552649999, till: 1457552649999, splits: [] } }; // returning old state
  });
  // first fetch retry for SPLIT_KILL event, due to previous unexpected response (response till minor than SPLIT_KILL changeNumber)
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552649999'), { throws: new TypeError('Network error') });
  // second fetch retry for SPLIT_KILL event
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552649999'), { throws: new TypeError('Network error') });
  // third fetch retry for SPLIT_KILL event
  fetchMock.getOnce(settings.url('/splitChanges?since=1457552649999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_THIRD_RETRY_FOR_SPLIT_KILL_EVENT), 'third fetch retry due to SPLIT_KILL event');

    setTimeout(() => {
      client.destroy().then(() => {
        assert.equal(client.getTreatment(key, 'whitelist'), 'control', 'evaluation returns control if client is destroyed');
        Backoff.DEFAULT_BASE_MILLIS = ORIGINAL_DEFAULT_BASE_MILLIS;
        assert.end();
      });
    });

    return { status: 408, body: 'request timeout' };
  });

  mockSegmentChanges(fetchMock, new RegExp(`${settings.url('/segmentChanges')}/(employees|developers)`), [key]);

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  fetchMock.post('*', 200);

  splitio = SplitFactory(config);
  client = splitio.client();

}