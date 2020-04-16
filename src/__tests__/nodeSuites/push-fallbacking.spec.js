/**
 * Validate the notification manager keeper process with OCCUPANCY events
 */

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552631000.SPLIT_UPDATE.json';

import occupancy0ControlPriMessage from '../mocks/message.OCCUPANCY.0.control_pri.json';
// import occupancy0ControlSecMessage from '../mocks/message.OCCUPANCY.0.control_sec.json';
import occupancy1ControlPriMessage from '../mocks/message.OCCUPANCY.1.control_pri.json';
import occupancy1ControlSecMessage from '../mocks/message.OCCUPANCY.1.control_sec.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552631000.json';
import segmentUpdateMessage from '../mocks/message.SEGMENT_UPDATE.1457552640000.json';

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
  scheduler: {
    featuresRefreshRate: 0.2,
    segmentsRefreshRate: 3000,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  urls: baseUrls,
  streamingEnabled: true,
  // debug: true,
};
const settings = SettingsFactory(config);

const MILLIS_SSE_OPEN = 100;
const MILLIS_SEGMENT_UPDATE_EVENT = MILLIS_SSE_OPEN + 100;
const MILLIS_STREAMING_DOWN = MILLIS_SEGMENT_UPDATE_EVENT + 100;
const MILLIS_SPLIT_UPDATE_EVENT_DURING_POLLING = MILLIS_STREAMING_DOWN + 100;
const MILLIS_SPLIT_POLLING = MILLIS_STREAMING_DOWN + settings.scheduler.featuresRefreshRate;
const MILLIS_STREAMING_UP = MILLIS_SPLIT_POLLING + 100;
const MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH = MILLIS_STREAMING_UP + 100;
const MILLIS_DESTROY = MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH + 100;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /segmentChanges/*)
 *  0.2 secs: SEGMENT_UPDATE event -> /segmentChanges/XXX
 *  0.3 secs: Streaming down
 *  0.4 secs: SPLIT_UPDATE event ignored
 *  0.5 secs: periodic fetch due to polling (/splitChanges, /segmentChanges/*)
 *  0.6 secs: Streaming up
 *  0.7 secs: SPLIT_UPDATE event -> /splitChanges
 */
export function testFallbacking(mock, assert) {
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
      eventSourceInstance.emitMessage(occupancy1ControlPriMessage);
      eventSourceInstance.emitMessage(occupancy1ControlSecMessage);
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'splitters'), 'on', 'evaluation with initial segment');
      client.once(client.Event.SDK_UPDATE, () => {
        assert.equal(client.getTreatment(key, 'splitters'), 'off', 'evaluation with updated segment');
      });
      eventSourceInstance.emitMessage(segmentUpdateMessage);
    }, MILLIS_SEGMENT_UPDATE_EVENT); // send a SEGMENT_UPDATE event

    setTimeout(() => {
      eventSourceInstance.emitMessage(occupancy0ControlPriMessage);
    }, MILLIS_STREAMING_DOWN); // send a OCCUPANCY event for switching to polling

    setTimeout(() => {
      eventSourceInstance.emitMessage(splitUpdateMessage);
    }, MILLIS_SPLIT_UPDATE_EVENT_DURING_POLLING); // send a SPLIT_UPDATE event while polling, to check that we are ignoring it

    setTimeout(() => {
      eventSourceInstance.emitMessage(occupancy1ControlPriMessage);
    }, MILLIS_STREAMING_UP); // send a OCCUPANCY event for switching to push

    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation of initial Split');
      client.once(client.Event.SDK_UPDATE, () => {
        assert.equal(client.getTreatment(key, 'whitelist'), 'allowed', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(splitUpdateMessage);
    }, MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH); // send a SPLIT_UPDATE event when push resumed, to check that we are handling it
    setTimeout(() => {
      client.destroy().then(() => {
        assert.end();
      });
    }, MILLIS_DESTROY); // destroy client after 0.6 seconds
  });

  mock.onGet(settings.url('/auth')).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabled];
  });

  // initial split and segment sync
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(200, splitChangesMock1);
  mock.onGet(settings.url('/segmentChanges/splitters?since=-1')).replyOnce(200, { since: -1, till: 1457552620999, name: 'splitters', added: [key], removed: [] });
  // extra reply due to double request (greedy fetch until since === till)
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552620999')).replyOnce(200, { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] });

  // split and segment sync after SSE opened
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, splitChangesMock2);
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552620999')).replyOnce(200, { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] });

  // fetch due to SEGMENT_UPDATE event
  mock.onGet(settings.url('/segmentChanges/splitters?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SEGMENT_UPDATE_EVENT), 'sync due to SEGMENT_UPDATE event');
    return [200, { since: 1457552620999, till: 1457552640000, name: 'splitters', added: [], removed: [key] }];
  });

  // fetch due to split polling
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_POLLING), 'fetch due to SPLIT polling');
    return [200, splitChangesMock2];
  });

  // split and segment sync due to streaming up
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, splitChangesMock2);

  // fetch due to SPLIT_UPDATE event
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH), 'sync due to SPLIT_UPDATE event');
    return [200, splitChangesMock3];
  });

  /**
   * mock the basic behaviour for remaining `/segmentChanges` requests:
   *  - when `?since=-1`, it returns a single key in `added` list (doesn't make sense a segment without items)
   *  - otherwise, it returns empty `added` and `removed` lists, and the same since and till values.
   */
  mock.onGet(new RegExp(`${settings.url('/segmentChanges')}/*`)).reply(function (request) {
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
    assert.fail('unnexpected request with url: ' + request.url);
  });
}