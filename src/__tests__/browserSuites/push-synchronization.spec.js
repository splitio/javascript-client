import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552631000.SPLIT_UPDATE.json';
import splitChangesMock4 from '../mocks/splitchanges.since.1457552631000.till.1457552650000.SPLIT_KILL.json';
import mySegmentsNicolasMock1 from '../mocks/mysegments.nicolas@split.io.json';
import mySegmentsNicolasMock2 from '../mocks/mysegments.nicolas@split.io.mock2.json';
import mySegmentsMarcio from '../mocks/mysegments.marcio@split.io.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552631000.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import mySegmentsUpdateMessage from '../mocks/message.MY_SEGMENTS_UPDATE.nicolas@split.io.1457552640000.json';
import mySegmentsUpdateMessageWithPayload from '../mocks/message.MY_SEGMENTS_UPDATE.marcio@split.io.1457552645000.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';
import authPushEnabledNicolasAndMarcio from '../mocks/auth.pushEnabled.nicolas@split.io.marcio@split.io.json';

import { nearlyEqual } from '../utils';

// Replace original EventSource with mock
import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';
window.EventSource = EventSourceMock;

import { SplitFactory } from '../../index';
import SettingsFactory from '../../utils/settings';

const userKey = 'nicolas@split.io';
const otherUserKey = 'marcio@split.io';

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
const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 300;
const MILLIS_MYSEGMENT_UPDATE_EVENT = 400;
const MILLIS_SPLIT_KILL_EVENT = 500;
const MILLIS_NEW_CLIENT = 600;
const MILLIS_SECOND_SSE_OPEN = 700;
const MILLIS_MY_SEGMENTS_UPDATE_WITH_PAYLOAD = 800;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /mySegments/*)
 *  0.2 secs: SPLIT_UPDATE event -> /splitChanges
 *  0.3 secs: SPLIT_UPDATE event with old changeNumber
 *  0.4 secs: MY_SEGMENTS_UPDATE event -> /mySegments/nicolas@split.io
 *  0.5 secs: SPLIT_KILL event -> /splitChanges
 *  0.6 secs: creates a new client -> new auth and SSE connection
 *  0.7 secs: SSE connection opened -> syncAll (/splitChanges, /mySegments/*)
 *  0.8 secs: MY_SEGMENTS_UPDATE event for new client (withPayload). client destroyed
 */
export function testSynchronization(mock, assert) {
  mock.reset();

  const start = Date.now();

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let otherClient;

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    /* events on first SSE connection */
    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

    setTimeout(() => {
      assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation of initial Split');
      client.once(client.Event.SDK_UPDATE, () => {
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
        assert.equal(client.getTreatment('splitters'), 'on', 'evaluation with updated MySegments list');
      });
      eventSourceInstance.emitMessage(mySegmentsUpdateMessage);
    }, MILLIS_MYSEGMENT_UPDATE_EVENT); // send a MY_SEGMENTS_UPDATE event with a new changeNumber after 0.4 seconds

    setTimeout(() => {
      assert.equal(client.getTreatment('whitelist'), 'allowed', 'evaluation with not killed Split');
      client.once(client.Event.SDK_UPDATE, () => {
        assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation with killed Split');
      });
      eventSourceInstance.emitMessage(splitKillMessage);
    }, MILLIS_SPLIT_KILL_EVENT); // send a SPLIT_KILL event with a new changeNumber after 0.5 seconds

    setTimeout(() => {
      otherClient = splitio.client(otherUserKey);

      setMockListener(function (eventSourceInstance) {
        const expectedSSEurl = `${settings.url('/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_MjE0MTkxOTU2Mg%3D%3D_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolasAndMarcio.token}&v=1.1&heartbeats=true`;
        assert.equals(eventSourceInstance.url, expectedSSEurl, 'new EventSource URL is the expected');

        /* events on second SSE connection */
        setTimeout(() => {
          eventSourceInstance.emitOpen();
        }, MILLIS_SECOND_SSE_OPEN - MILLIS_NEW_CLIENT); // open new SSE connection

        setTimeout(() => {
          assert.equal(otherClient.getTreatment('qc_team'), 'no', 'evaluation with initial MySegments list (shared client)');
          otherClient.once(otherClient.Event.SDK_UPDATE, () => {
            assert.equal(otherClient.getTreatment('qc_team'), 'yes', 'evaluation with updated MySegments list (shared client)');

            // destroy shared client and then main client
            otherClient.destroy().then(() => {
              assert.equal(otherClient.getTreatment('whitelist'), 'control', 'evaluation returns control for shared client if it is destroyed');
              assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation returns correct tratment for main client');
              client.destroy().then(() => {
                assert.equal(client.getTreatment('whitelist'), 'control', 'evaluation returns control for main client if it is destroyed');
                assert.end();
              });
            });
          });
          eventSourceInstance.emitMessage(mySegmentsUpdateMessageWithPayload);
        }, MILLIS_MY_SEGMENTS_UPDATE_WITH_PAYLOAD - MILLIS_NEW_CLIENT); // send a MY_SEGMENTS_UPDATE event with payload after 0.1 seconds from new SSE connection opened

      });

    }, MILLIS_NEW_CLIENT); // creates a new client after 0.6 seconds

  });

  // initial auth
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabledNicolas];
  });

  // reauth due to new client
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}&users=${encodeURIComponent(otherUserKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('second auth success');
    return [200, authPushEnabledNicolasAndMarcio];
  });

  // initial split and mySegments sync
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return [200, splitChangesMock1];
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // split and segment sync after SSE opened
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN), 'sync after SSE connection is opened');
    return [200, splitChangesMock2];
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock1);

  // fetch due to SPLIT_UPDATE event
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_FIRST_SPLIT_UPDATE_EVENT), 'sync due to SPLIT_UPDATE event');
    return [200, splitChangesMock3];
  });

  // fetch due to first MY_SEGMENTS_UPDATE event
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_MYSEGMENT_UPDATE_EVENT), 'sync due to MY_SEGMENTS_UPDATE event');
    return [200, mySegmentsNicolasMock2];
  });

  // fetch due to SPLIT_KILL event
  mock.onGet(settings.url('/splitChanges?since=1457552631000')).replyOnce(function () {
    assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation with split killed immediately, before fetch is done');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'sync due to SPLIT_KILL event');
    return [200, splitChangesMock4];
  });

  // split and mySegment sync after second SSE opened
  mock.onGet(settings.url('/splitChanges?since=1457552650000')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SECOND_SSE_OPEN), 'sync after second SSE connection is opened');
    console.log('lapse: ' + lapse);
    return [200, { splits: [], since: 1457552650000, till: 1457552650000 }];
  });
  mock.onGet(settings.url('/mySegments/nicolas@split.io')).replyOnce(200, mySegmentsNicolasMock2);
  mock.onGet(settings.url('/mySegments/marcio@split.io')).replyOnce(200, mySegmentsMarcio);

  mock.onGet(new RegExp('.*')).reply(function (request) {
    assert.fail('unexpected GET request with url: ' + request.url);
  });
}