/**
 * Validate the handling of OCCUPANCY and CONTROL events
 */

import splitChangesMock1 from '../mocks/splitchanges.real.withSegments.json'; // since: -1, till: 1457552620999 (for initial fetch)
import splitChangesMock2 from '../mocks/splitchanges.real.updateWithSegments.json'; // since: 1457552620999, till: 1457552649999 (for SPLIT_UPDATE event)
import splitChangesMock3 from '../mocks/splitchanges.real.updateWithoutSegments.json'; // since: 1457552649999, till: 1457552669999 (for second polling fetch)
import mySegmentsNicolasMock1 from '../mocks/mysegments.nicolas@split.io.json';
import mySegmentsNicolasMock2 from '../mocks/mysegments.nicolas@split.io.mock2.json';
import mySegmentsMarcio from '../mocks/mysegments.marcio@split.io.json';

import occupancy0ControlPriMessage from '../mocks/message.OCCUPANCY.0.control_pri.1586987434550.json';
import occupancy1ControlPriMessage from '../mocks/message.OCCUPANCY.1.control_pri.1586987434450.json';
import occupancy1ControlSecMessage from '../mocks/message.OCCUPANCY.1.control_sec.1586987434451.json';
import occupancy2ControlPriMessage from '../mocks/message.OCCUPANCY.2.control_pri.1586987434650.json';

import streamingPausedControlPriMessage from '../mocks/message.CONTROL.STREAMING_PAUSED.control_pri.1586987434750.json';
import streamingResumedControlPriMessage from '../mocks/message.CONTROL.STREAMING_RESUMED.control_pri.1586987434850.json';
import streamingDisabledControlPriMessage from '../mocks/message.CONTROL.STREAMING_DISABLED.control_pri.1586987434950.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552649999.json';
import mySegmentsUpdateMessage from '../mocks/message.MY_SEGMENTS_UPDATE.nicolas@split.io.1457552640000.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';
import authPushEnabledNicolasAndMarcio from '../mocks/auth.pushEnabled.nicolas@split.io.marcio@split.io.json';

import { nearlyEqual } from '../utils';

import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';
window.EventSource = EventSourceMock;

import { SplitFactory } from '../../index';
import SettingsFactory from '../../utils/settings';

const userKey = 'nicolas@split.io';
const secondUserKey = 'marcio@split.io';

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
  scheduler: {
    featuresRefreshRate: 0.2,
    segmentsRefreshRate: 0.25,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  urls: baseUrls,
  streamingEnabled: true,
  // debug: true,
};
const settings = SettingsFactory(config);

const MILLIS_SSE_OPEN = 100;
const MILLIS_STREAMING_DOWN_OCCUPANCY = MILLIS_SSE_OPEN + 100;
const MILLIS_SPLIT_UPDATE_EVENT_DURING_POLLING = MILLIS_STREAMING_DOWN_OCCUPANCY + 100;
const MILLIS_STREAMING_UP_OCCUPANCY = MILLIS_STREAMING_DOWN_OCCUPANCY + settings.scheduler.featuresRefreshRate + 100;
const MILLIS_CREATE_CLIENT_DURING_PUSH = MILLIS_STREAMING_UP_OCCUPANCY + 50;
const MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH = MILLIS_STREAMING_UP_OCCUPANCY + 100;

const MILLIS_STREAMING_PAUSED_CONTROL = MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH + 100;
const MILLIS_MY_SEGMENTS_UPDATE_EVENT_DURING_POLLING = MILLIS_STREAMING_PAUSED_CONTROL + 100;
const MILLIS_STREAMING_RESUMED_CONTROL = MILLIS_STREAMING_PAUSED_CONTROL + settings.scheduler.featuresRefreshRate + 100;
const MILLIS_MY_SEGMENTS_UPDATE_EVENT_DURING_PUSH = MILLIS_STREAMING_RESUMED_CONTROL + 100;
const MILLIS_STREAMING_DISABLED_CONTROL = MILLIS_MY_SEGMENTS_UPDATE_EVENT_DURING_PUSH + 100;
const MILLIS_DESTROY = MILLIS_STREAMING_DISABLED_CONTROL + settings.scheduler.featuresRefreshRate * 2 + 100;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /mySegments/nicolas)
 *  0.2 secs: Streaming down (OCCUPANCY event) -> fetch due to fallback to polling (/splitChanges, /mySegments/nicolas)
 *  0.3 secs: SPLIT_UPDATE event ignored
 *  0.4 secs: periodic fetch due to polling (/splitChanges)
 *  0.45 secs: periodic fetch due to polling (/mySegments/*)
 *  0.5 secs: Streaming up (OCCUPANCY event) -> syncAll (/splitChanges, /mySegments/nicolas)
 *  0.55 secs: create a new client while streaming -> initial fetch (/mySegments/marcio), auth, SSE connection and syncAll (/splitChanges, /mySegments/nicolas, /mySegments/marcio)
 *  0.6 secs: SPLIT_UPDATE event -> /splitChanges
 *  0.7 secs: Streaming down (CONTROL event) -> fetch due to fallback to polling (/splitChanges, /mySegments/nicolas, /mySegments/marcio)
 *  0.8 secs: MY_SEGMENTS_UPDATE event ignored
 *  0.9 secs: periodic fetch due to polling (/splitChanges)
 *  0.95 secs: periodic fetch due to polling (/mySegments/nicolas, /mySegments/marcio)
 *  1.0 secs: Streaming up (CONTROL event) -> syncAll (/splitChanges, /mySegments/nicolas, /mySegments/marcio)
 *  1.1 secs: MY_SEGMENTS_UPDATE event -> /mySegments/nicolas
 *  1.2 secs: Streaming down (CONTROL event) -> fetch due to fallback to polling (/splitChanges, /mySegments/nicolas, /mySegments/marcio)
 *  1.4 secs: periodic fetch due to polling (/splitChanges): due to update without segments, mySegments are not fetched
 *  1.6 secs: periodic fetch due to polling (/splitChanges)
 *  1.7 secs: destroy client
 */
export function testFallbacking(mock, assert) {
  assert.plan(14);
  mock.reset();

  const start = Date.now();

  const splitio = SplitFactory(config);
  const client = splitio.client();
  // eslint-disable-next-line no-unused-vars
  let secondClient;

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {

    const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    setTimeout(() => {
      eventSourceInstance.emitOpen();
      eventSourceInstance.emitMessage(occupancy1ControlPriMessage);
      eventSourceInstance.emitMessage(occupancy1ControlSecMessage);
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

    setTimeout(() => {
      eventSourceInstance.emitMessage(occupancy0ControlPriMessage);
    }, MILLIS_STREAMING_DOWN_OCCUPANCY); // send an OCCUPANCY event for switching to polling

    setTimeout(() => {
      eventSourceInstance.emitMessage(splitUpdateMessage);
    }, MILLIS_SPLIT_UPDATE_EVENT_DURING_POLLING); // send a SPLIT_UPDATE event while polling, to check that we are ignoring it

    setTimeout(() => {
      eventSourceInstance.emitMessage(occupancy2ControlPriMessage);
    }, MILLIS_STREAMING_UP_OCCUPANCY); // send a OCCUPANCY event for switching to push

    setTimeout(() => {
      secondClient = splitio.client(secondUserKey);

      setMockListener(function (eventSourceInstance) {
        const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_MjE0MTkxOTU2Mg%3D%3D_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolasAndMarcio.token}&v=1.1&heartbeats=true`;
        assert.equals(eventSourceInstance.url, expectedSSEurl, 'new EventSource URL is the expected');
        eventSourceInstance.emitOpen();

        setTimeout(() => {
          assert.equal(client.getTreatment('real_split'), 'on', 'evaluation of initial Split');
          client.once(client.Event.SDK_UPDATE, () => {
            assert.equal(client.getTreatment('real_split'), 'off', 'evaluation of updated Split');
          });
          eventSourceInstance.emitMessage(splitUpdateMessage);
        }, MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH - MILLIS_CREATE_CLIENT_DURING_PUSH); // send a SPLIT_UPDATE event when push resumed, to check that we are handling it

        setTimeout(() => {
          eventSourceInstance.emitMessage(streamingPausedControlPriMessage);
        }, MILLIS_STREAMING_PAUSED_CONTROL - MILLIS_CREATE_CLIENT_DURING_PUSH); // send a CONTROL event for switching to polling

        setTimeout(() => {
          eventSourceInstance.emitMessage(mySegmentsUpdateMessage);
        }, MILLIS_MY_SEGMENTS_UPDATE_EVENT_DURING_POLLING - MILLIS_CREATE_CLIENT_DURING_PUSH); // send a MY_SEGMENTS_UPDATE event while polling, to check that we are ignoring it

        setTimeout(() => {
          eventSourceInstance.emitMessage(streamingResumedControlPriMessage);
        }, MILLIS_STREAMING_RESUMED_CONTROL - MILLIS_CREATE_CLIENT_DURING_PUSH); // send a CONTROL event for switching to push

        setTimeout(() => {
          assert.equal(client.getTreatment('real_split'), 'off', 'evaluation with initial segment');
          client.once(client.Event.SDK_UPDATE, () => {
            assert.equal(client.getTreatment('real_split'), 'on', 'evaluation with updated segment');
          });
          eventSourceInstance.emitMessage(mySegmentsUpdateMessage);
        }, MILLIS_MY_SEGMENTS_UPDATE_EVENT_DURING_PUSH - MILLIS_CREATE_CLIENT_DURING_PUSH); // send a MY_SEGMENTS_UPDATE event

        setTimeout(() => {
          eventSourceInstance.emitMessage(streamingDisabledControlPriMessage);
          assert.equal(eventSourceInstance.readyState, EventSourceMock.CLOSED, 'EventSource connection closed on STREAMING_DISABLED CONTROL event');
        }, MILLIS_STREAMING_DISABLED_CONTROL - MILLIS_CREATE_CLIENT_DURING_PUSH); // send a CONTROL event for disabling push and switching to polling

        setTimeout(() => {
          client.destroy().then(() => {
            assert.pass('client destroyed');
          });
        }, MILLIS_DESTROY - MILLIS_CREATE_CLIENT_DURING_PUSH); // destroy client after 1.7 seconds

      });

    }, MILLIS_CREATE_CLIENT_DURING_PUSH); // create a second client

  });

  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabledNicolas];
  });

  // initial split and mySegment sync
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(200, splitChangesMock1);
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // split and segment sync after SSE opened
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, { splits: [], since: 1457552620999, till: 1457552620999 });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // fetches due to first fallback to polling
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, { splits: [], since: 1457552620999, till: 1457552620999 });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_STREAMING_DOWN_OCCUPANCY + settings.scheduler.featuresRefreshRate), 'fetch due to first fallback to polling');
    return [200, { splits: [], since: 1457552620999, till: 1457552620999 }];
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // split and segment sync due to streaming up (OCCUPANCY event)
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, { splits: [], since: 1457552620999, till: 1457552620999 });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // initial shared client sync, reauth and syncAll due to new client
  mock.onGet(settings.url('/mySegments/marcio@split.io')).replyOnce(200, mySegmentsMarcio);
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}&users=${encodeURIComponent(secondUserKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('second auth success');
    return [200, authPushEnabledNicolasAndMarcio];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(200, { splits: [], since: 1457552620999, till: 1457552620999 });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);
  mock.onGet(settings.url('/mySegments/marcio@split.io')).replyOnce(200, mySegmentsMarcio);

  // fetch due to SPLIT_UPDATE event
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH), 'sync due to SPLIT_UPDATE event');
    return [200, splitChangesMock2];
  });

  // fetches due to second fallback to polling
  mock.onGet(settings.url('/splitChanges?since=1457552649999')).replyOnce(200, { splits: [], since: 1457552649999, till: 1457552649999 });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);
  mock.onGet(settings.url('/mySegments/marcio@split.io')).replyOnce(200, mySegmentsMarcio);
  mock.onGet(settings.url('/splitChanges?since=1457552649999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_STREAMING_PAUSED_CONTROL + settings.scheduler.featuresRefreshRate), 'fetch due to second fallback to polling');
    return [200, { splits: [], since: 1457552649999, till: 1457552649999 }];
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);
  mock.onGet(settings.url('/mySegments/marcio@split.io')).replyOnce(200, mySegmentsMarcio);

  // split and segment sync due to streaming up (CONTROL event)
  mock.onGet(settings.url('/splitChanges?since=1457552649999')).replyOnce(200, { splits: [], since: 1457552649999, till: 1457552649999 });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);
  mock.onGet(settings.url('/mySegments/marcio@split.io')).replyOnce(200, mySegmentsMarcio);

  // fetch due to MY_SEGMENTS_UPDATE event
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_MY_SEGMENTS_UPDATE_EVENT_DURING_PUSH), 'sync due to MY_SEGMENTS_UPDATE event');
    return [200, mySegmentsNicolasMock2];
  });

  // fetches due to third fallback to polling (mySegments is not fetched after the first iteration)
  mock.onGet(settings.url('/splitChanges?since=1457552649999')).replyOnce(200, { splits: [], since: 1457552649999, till: 1457552649999 });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);
  mock.onGet(settings.url('/mySegments/marcio@split.io')).replyOnce(200, mySegmentsMarcio);
  mock.onGet(settings.url('/splitChanges?since=1457552649999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_STREAMING_DISABLED_CONTROL + settings.scheduler.featuresRefreshRate), 'fetch due to third fallback to polling');
    return [200, splitChangesMock3];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552669999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_STREAMING_DISABLED_CONTROL + settings.scheduler.featuresRefreshRate * 2), 'fetch due to third fallback to polling');
    return [200, { splits: [], since: 1457552669999, till: 1457552669999 }];
  });

  mock.onGet(new RegExp('.*')).reply(function (request) {
    assert.fail('unexpected GET request with url: ' + request.url);
  });
}