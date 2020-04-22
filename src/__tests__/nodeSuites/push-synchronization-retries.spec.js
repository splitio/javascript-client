import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552631000.SPLIT_UPDATE.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552631000.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import segmentUpdateMessage from '../mocks/message.SEGMENT_UPDATE.1457552640000.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';
import secondSegmentUpdateMessage from '../mocks/message.SEGMENT_UPDATE.1457552650000.json';

import authPushEnabled from '../mocks/auth.pushEnabled.node.json';

import { nearlyEqual } from '../utils';

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
const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 300;
const MILLIS_SEGMENT_UPDATE_EVENT = 400;
const MILLIS_SPLIT_KILL_EVENT = 500;
const MILLIS_SECOND_SEGMENT_UPDATE_EVENT = 600;
const MILLIS_DESTROY = 700;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /segmentChanges/*)
 *  0.2 secs: SPLIT_UPDATE event -> /splitChanges: network error and then success -> SDK_UPDATE triggered
 *  0.3 secs: SPLIT_UPDATE event with old changeNumber -> SDK_UPDATE not triggered
 *  0.4 secs: SEGMENT_UPDATE event -> /segmentChanges/*: bad response and then success -> SDK_UPDATE triggered
 *  0.5 secs: SPLIT_KILL event -> /splitChanges: bad response and network error -> SDK_UPDATE triggered although fetches fail
 *  0.6 secs: SEGMENT_UPDATE event -> /segmentChanges/*: bad response and then fail -> SDK_UPDATE not triggered
 */
export function testSynchronizationRetries(mock, assert) {
  assert.plan(18);
  mock.reset();
  __setEventSource(EventSourceMock);

  const start = Date.now();

  const splitio = SplitFactory(config);
  const client = splitio.client();

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_segments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabled.token}&v=1.1&heartbeats=true`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation of initial Split');
      client.once(client.Event.SDK_UPDATE, () => {
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
    setTimeout(() => {
      client.once(client.Event.SDK_UPDATE, () => {
        assert.fail('SDK_UPDATE event must not be triggered due to fetch failures');
      });
      eventSourceInstance.emitMessage(secondSegmentUpdateMessage);
    }, MILLIS_SECOND_SEGMENT_UPDATE_EVENT); // send a second SEGMENT_UPDATE event with a new changeNumber after 0.6 seconds
    setTimeout(() => {
      client.destroy().then(() => {
        assert.equal(client.getTreatment(key, 'whitelist'), 'control', 'evaluation returns control if client is destroyed');
        assert.end();
      });
    }, MILLIS_DESTROY); // destroy client after 0.7 seconds
  });

  mock.onGet(settings.url('/auth')).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabled];
  });

  // initial split and segment sync
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return [200, splitChangesMock1];
  });
  mock.onGet(settings.url('/segmentChanges/splitters?since=-1')).replyOnce(
    200, { since: -1, till: 1457552620999, name: 'splitters', added: [key], removed: [] }
  );
  // extra retry due to double request (greedy fetch). @TODO: remove once `SplitChangesUpdaterFactory` and `segmentChangesFetcher` are updated
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552620999')).replyOnce(
    200, { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] }
  );

  // split and segment sync after SSE opened
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN), 'sync after SSE connection is opened');
    return [200, splitChangesMock2];
  });
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552620999')).replyOnce(
    200, { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] }
  );

  // fetch due to SPLIT_UPDATE event
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).networkErrorOnce();
  // fetch retry for SPLIT_UPDATE event, due to previous fail
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, splitChangesMock3);

  // fetch due to SEGMENT_UPDATE event
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SEGMENT_UPDATE_EVENT), 'sync due to SEGMENT_UPDATE event');
    return [200, { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] }];
  });
  // fetch retry for SEGMENT_UPDATE event, due to previous unexpected response (response till minor than SEGMENT_UPDATE changeNumber)
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SEGMENT_UPDATE_EVENT), 'sync retry for SEGMENT_UPDATE event');
    return [200, { since: 1457552620999, till: 1457552640000, name: 'splitters', added: [], removed: [key] }];
  });
  // extra retry (fetch until since === till)
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552640000')).replyOnce(200, { since: 1457552640000, till: 1457552640000, name: 'splitters', added: [], removed: [] });

  // fetch due to SPLIT_KILL event
  mock.onGet(settings.url('/splitChanges?since=1457552631000')).replyOnce(function () {
    assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation with split killed immediately, before fetch is done');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'sync due to SPLIT_KILL event');
    return [200, { since: 1457552631000, till: 1457552631000, splits: [] }]; // returning old state
  });
  // fetch retry for SPLIT_KILL event, due to previous unexpected response (response till minor than SPLIT_KILL changeNumber)
  mock.onGet(settings.url('/splitChanges?since=1457552631000')).networkErrorOnce();

  // fetch due to second SEGMENT_UPDATE event
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552640000')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SECOND_SEGMENT_UPDATE_EVENT), 'sync due to second SEGMENT_UPDATE event');
    return [200, { since: 1457552640000, till: 1457552640000, name: 'splitters', added: [], removed: [] }];
  });
  // fetch retry for SEGMENT_UPDATE event, due to previous unexpected response (response till minor than SEGMENT_UPDATE changeNumber)
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552640000')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SECOND_SEGMENT_UPDATE_EVENT), 'sync retry for second SEGMENT_UPDATE event');
    return [408, 'request timeout'];
  });

  /**
   * mock the basic behaviour for remaining `/segmentChanges` requests:
   *  - when `?since=-1`, it returns a single key in `added` list (doesn't make sense a segment without items)
   *  - otherwise, it returns empty `added` and `removed` lists, and the same since and till values.
   */
  mock.onGet(new RegExp(`${settings.url('/segmentChanges')}/(employees|developers)`)).reply(function (request) {
    const since = parseInt(request.url.split('=').pop());
    const name = request.url.split('?')[0].split('/').pop();
    return [200, {
      'name': name,
      'added': since === -1 ? [key] : [],
      'removed': [],
      'since': since,
      'till': since === -1 ? 1457552620999 : since,
    }];
  });

  mock.onGet(new RegExp('.*')).reply(function (request) {
    assert.fail('unexpected GET request with url: ' + request.url);
  });
}