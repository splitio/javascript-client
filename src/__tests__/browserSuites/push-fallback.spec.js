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
import occupancy2ControlPriMessage from '../mocks/message.OCCUPANCY.2.control_pri.1586987434650.json';
import occupancy0ControlSecMessage from '../mocks/message.OCCUPANCY.0.control_sec.1586987434451.json';

import streamingPausedControlPriMessage from '../mocks/message.CONTROL.STREAMING_PAUSED.control_pri.1586987434750.json';
import streamingResumedControlPriMessage from '../mocks/message.CONTROL.STREAMING_RESUMED.control_pri.1586987434850.json';
import streamingPausedControlPriMessage2 from '../mocks/message.CONTROL.STREAMING_PAUSED.control_pri.1586987434900.json';
import streamingDisabledControlPriMessage from '../mocks/message.CONTROL.STREAMING_DISABLED.control_pri.1586987434950.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552649999.json';
import mySegmentsUpdateMessage from '../mocks/message.MY_SEGMENTS_UPDATE.nicolas@split.io.1457552640000.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';
import authPushEnabledNicolasAndMarcio from '../mocks/auth.pushEnabled.nicolas@split.io.marcio@split.io.json';

import streamingResetMessage from '../mocks/message.STREAMING_RESET.json';

import { nearlyEqual, url } from '../testUtils';

import EventSourceMock, { setMockListener } from '../testUtils/eventSourceMock';
window.EventSource = EventSourceMock;

import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const userKey = 'nicolas@split.io';
const secondUserKey = 'marcio@split.io';

const baseUrls = {
  sdk: 'https://sdk.push-fallback/api',
  events: 'https://events.push-fallback/api',
  auth: 'https://auth.push-fallback/api'
};
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: userKey
  },
  scheduler: {
    featuresRefreshRate: 0.2,
    segmentsRefreshRate: 0.25,
    impressionsRefreshRate: 3000
  },
  urls: baseUrls,
  streamingEnabled: true,
};
const settings = settingsFactory(config);

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

const MILLIS_STREAMING_PAUSED_CONTROL_2 = MILLIS_MY_SEGMENTS_UPDATE_EVENT_DURING_PUSH + 100;
const MILLIS_STREAMING_RESET_WHILE_PUSH_DOWN = MILLIS_STREAMING_PAUSED_CONTROL_2 + 100;
const MILLIS_STREAMING_RESET_WHILE_PUSH_UP = MILLIS_STREAMING_RESET_WHILE_PUSH_DOWN + settings.scheduler.featuresRefreshRate;
const MILLIS_STREAMING_DISABLED_CONTROL = MILLIS_STREAMING_RESET_WHILE_PUSH_UP + 100;
const MILLIS_DESTROY = MILLIS_STREAMING_DISABLED_CONTROL + settings.scheduler.featuresRefreshRate * 2 + 100;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/nicolas), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /mySegments/nicolas)
 *  0.2 secs: Streaming down (OCCUPANCY event) -> fetch due to fallback to polling (/splitChanges, /mySegments/nicolas)
 *  0.3 secs: SPLIT_UPDATE event ignored
 *  0.4 secs: periodic fetch due to polling (/splitChanges)
 *  0.45 secs: periodic fetch due to polling (/mySegments/nicolas)
 *  0.5 secs: Streaming up (OCCUPANCY event) -> syncAll (/splitChanges, /mySegments/nicolas)
 *  0.55 secs: create a new client while streaming -> initial fetch (/mySegments/marcio), auth, SSE connection and syncAll (/splitChanges, /mySegments/nicolas, /mySegments/marcio)
 *  0.6 secs: SPLIT_UPDATE event -> /splitChanges
 *  0.7 secs: Streaming down (CONTROL event) -> fetch due to fallback to polling (/splitChanges, /mySegments/nicolas, /mySegments/marcio)
 *  0.8 secs: MY_SEGMENTS_UPDATE event ignored
 *  0.9 secs: periodic fetch due to polling (/splitChanges)
 *  0.95 secs: periodic fetch due to polling (/mySegments/nicolas, /mySegments/marcio, /mySegments/facundo)
 *  1.0 secs: Streaming up (CONTROL event) -> syncAll (/splitChanges, /mySegments/nicolas, /mySegments/marcio, /mySegments/facundo)
 *  1.1 secs: MY_SEGMENTS_UPDATE event -> /mySegments/nicolas
 *  1.2 secs: Streaming down (CONTROL event) -> fetch due to fallback to polling (/splitChanges, /mySegments/nicolas, /mySegments/marcio, /mySegments/facundo)
 *  1.3 secs: STREAMING_RESET control event -> auth, SSE connection, syncAll and stop polling
 *  1.5 secs: STREAMING_RESET control event -> auth, SSE connection, syncAll
 *  1.6 secs: Streaming closed (CONTROL STREAMING_DISABLED event) -> fetch due to fallback to polling (/splitChanges, /mySegments/nicolas, /mySegments/marcio, /mySegments/facundo)
 *  1.8 secs: periodic fetch due to polling (/splitChanges): due to update without segments, mySegments are not fetched
 *  2.0 secs: periodic fetch due to polling (/splitChanges)
 *  2.1 secs: destroy client
 */
export function testFallback(fetchMock, assert) {
  assert.plan(20);
  fetchMock.reset();

  let start, splitio, client, secondClient;

  // mock SSE open and message events
  setMockListener((eventSourceInstance) => {

    const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true&SplitSDKVersion=${settings.version}&SplitSDKClientKey=h-1>`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    setTimeout(() => {
      eventSourceInstance.emitOpen();
      eventSourceInstance.emitMessage(occupancy1ControlPriMessage);
      eventSourceInstance.emitMessage(occupancy0ControlSecMessage);
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

    setTimeout(() => {
      eventSourceInstance.emitMessage(occupancy0ControlPriMessage);
    }, MILLIS_STREAMING_DOWN_OCCUPANCY); // send an OCCUPANCY event for switching to polling

    setTimeout(() => {
      assert.equal(eventSourceInstance.readyState, EventSourceMock.OPEN, 'EventSource connection keeps opened after PUSH_SUBSYSTEM_DOWN (occupancy 0)');
      eventSourceInstance.emitMessage(splitUpdateMessage);
    }, MILLIS_SPLIT_UPDATE_EVENT_DURING_POLLING); // send a SPLIT_UPDATE event while polling, to check that we are ignoring it

    setTimeout(() => {
      eventSourceInstance.emitMessage(occupancy2ControlPriMessage);
    }, MILLIS_STREAMING_UP_OCCUPANCY); // send a OCCUPANCY event for switching to push

    setTimeout(() => {
      secondClient = splitio.client(secondUserKey);

      setMockListener((eventSourceInstance) => {
        const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_MjE0MTkxOTU2Mg%3D%3D_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolasAndMarcio.token}&v=1.1&heartbeats=true&SplitSDKVersion=${settings.version}&SplitSDKClientKey=h-1>`;
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
          assert.equal(eventSourceInstance.readyState, EventSourceMock.OPEN, 'EventSource connection keeps opened after PUSH_SUBSYSTEM_DOWN (STREAMING_PAUSED event)');
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
          eventSourceInstance.emitMessage(streamingPausedControlPriMessage2);
        }, MILLIS_STREAMING_PAUSED_CONTROL_2 - MILLIS_CREATE_CLIENT_DURING_PUSH); // send a CONTROL event for switching back to polling

        setTimeout(() => {
          eventSourceInstance.emitMessage(streamingResetMessage);

          setMockListener((eventSourceInstance) => {
            eventSourceInstance.emitOpen();

            setTimeout(() => {
              eventSourceInstance.emitMessage(streamingResetMessage);

              setMockListener((eventSourceInstance) => {
                eventSourceInstance.emitOpen();

                setTimeout(() => {
                  eventSourceInstance.emitMessage(streamingDisabledControlPriMessage);
                  assert.equal(eventSourceInstance.readyState, EventSourceMock.CLOSED, 'EventSource connection closed on STREAMING_DISABLED CONTROL event');
                }, MILLIS_STREAMING_DISABLED_CONTROL - MILLIS_STREAMING_RESET_WHILE_PUSH_UP); // send a CONTROL event for disabling push and switching to polling

                setTimeout(() => {
                  Promise.all([secondClient.destroy(), client.destroy()]).then(() => {
                    assert.pass('client destroyed');
                  });
                }, MILLIS_DESTROY - MILLIS_STREAMING_RESET_WHILE_PUSH_UP); // destroy client
              });
            }, MILLIS_STREAMING_RESET_WHILE_PUSH_UP - MILLIS_STREAMING_RESET_WHILE_PUSH_DOWN); // send a new STREAMING_RESET event while PUSH is up
          });
        }, MILLIS_STREAMING_RESET_WHILE_PUSH_DOWN - MILLIS_CREATE_CLIENT_DURING_PUSH); // send a STREAMING_RESET event while PUSH is down, for re-connecting push

      });

    }, MILLIS_CREATE_CLIENT_DURING_PUSH); // create a second client

  });

  fetchMock.getOnce(url(settings, `/v2/auth?s=1.2&users=${encodeURIComponent(userKey)}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabledNicolas };
  });

  // initial split and mySegment sync
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });

  // split and segment sync after SSE opened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });

  // fetches due to first fallback to polling
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_STREAMING_DOWN_OCCUPANCY + settings.scheduler.featuresRefreshRate), 'fetch due to first fallback to polling');
    return { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } };
  });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });

  // split and segment sync due to streaming up (OCCUPANCY event)
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });

  // creating of second client during streaming: initial mysegment sync, reauth and syncAll due to new client
  fetchMock.getOnce(url(settings, '/mySegments/marcio%40split.io'), { status: 200, body: mySegmentsMarcio });
  fetchMock.get({ url: url(settings, `/v2/auth?s=1.2&users=${encodeURIComponent(userKey)}&users=${encodeURIComponent(secondUserKey)}`), repeat: 3 /* initial + 2 STREAMING_RESET */ }, (url, opts) => {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('second auth success');
    return { status: 200, body: authPushEnabledNicolasAndMarcio };
  });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });
  fetchMock.getOnce(url(settings, '/mySegments/marcio%40split.io'), { status: 200, body: mySegmentsMarcio });

  // fetch due to SPLIT_UPDATE event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552620999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_UPDATE_EVENT_DURING_PUSH), 'sync due to SPLIT_UPDATE event');
    return { status: 200, body: splitChangesMock2 };
  });

  // fetches due to second fallback to polling
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552649999'), { status: 200, body: { splits: [], since: 1457552649999, till: 1457552649999 } });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });
  fetchMock.getOnce(url(settings, '/mySegments/marcio%40split.io'), { status: 200, body: mySegmentsMarcio });

  // continue fetches due to second fallback to polling
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552649999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_STREAMING_PAUSED_CONTROL + settings.scheduler.featuresRefreshRate), 'fetch due to second fallback to polling');
    return { status: 200, body: { splits: [], since: 1457552649999, till: 1457552649999 } };
  });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });
  fetchMock.getOnce(url(settings, '/mySegments/marcio%40split.io'), { status: 200, body: mySegmentsMarcio });

  // split and segment sync due to streaming up (CONTROL event)
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552649999'), { status: 200, body: { splits: [], since: 1457552649999, till: 1457552649999 } });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolasMock1 });
  fetchMock.getOnce(url(settings, '/mySegments/marcio%40split.io'), { status: 200, body: mySegmentsMarcio });

  // fetch due to MY_SEGMENTS_UPDATE event
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_MY_SEGMENTS_UPDATE_EVENT_DURING_PUSH), 'sync due to MY_SEGMENTS_UPDATE event');
    return { status: 200, body: mySegmentsNicolasMock2 };
  });

  // fetches due to third fallback to polling (STREAMING_PAUSED), two sync all (two STREAMING_RESET events) and fourth fallback (STREAMING_DISABLED)
  fetchMock.get({ url: url(settings, '/splitChanges?s=1.2&since=1457552649999'), repeat: 4 }, { status: 200, body: { splits: [], since: 1457552649999, till: 1457552649999 } });
  fetchMock.get({ url: url(settings, '/mySegments/nicolas%40split.io'), repeat: 4 }, { status: 200, body: mySegmentsNicolasMock1 });
  fetchMock.get({ url: url(settings, '/mySegments/marcio%40split.io'), repeat: 4 }, { status: 200, body: mySegmentsMarcio });

  // Periodic fetch due to polling (mySegments is not fetched due to smart pausing)
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552649999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_STREAMING_DISABLED_CONTROL + settings.scheduler.featuresRefreshRate), 'fetch due to fourth fallback to polling');
    return { status: 200, body: splitChangesMock3 };
  });
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.2&since=1457552669999'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_STREAMING_DISABLED_CONTROL + settings.scheduler.featuresRefreshRate * 2), 'fetch due to fourth fallback to polling');
    return { status: 200, body: { splits: [], since: 1457552669999, till: 1457552669999 } };
  });

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  fetchMock.post('*', 200);

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();

}
