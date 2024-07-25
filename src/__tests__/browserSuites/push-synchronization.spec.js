import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552649999.SPLIT_UPDATE.json';
import splitChangesMock4 from '../mocks/splitchanges.since.1457552649999.till.1457552650000.SPLIT_KILL.json';
import mySegmentsNicolasMock1 from '../mocks/mysegments.nicolas@split.io.json';
import mySegmentsNicolasMock2 from '../mocks/mysegments.nicolas@split.io.mock2.json';
import mySegmentsMarcio from '../mocks/mysegments.marcio@split.io.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552649999.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import mySegmentsUpdateMessageNoPayload from '../mocks/message.MY_SEGMENTS_UPDATE.nicolas@split.io.1457552640000.json';
import mySegmentsUpdateMessageWithPayload from '../mocks/message.MY_SEGMENTS_UPDATE.marcio@split.io.1457552645000.json';
import mySegmentsUpdateMessageWithEmptyPayload from '../mocks/message.MY_SEGMENTS_UPDATE.marcio@split.io.1457552646000.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';

import unboundedMessage from '../mocks/message.V2.UNBOUNDED.1457552650000.json';
import boundedZlibMessage from '../mocks/message.V2.BOUNDED.ZLIB.1457552651000.json';
import keylistGzipMessage from '../mocks/message.V2.KEYLIST.GZIP.1457552652000.json';
import segmentRemovalMessage from '../mocks/message.V2.SEGMENT_REMOVAL.1457552653000.json';
import unboundedMyLargeSegmentsMessage from '../mocks/message.MY_LARGE_SEGMENTS_UPDATE.UNBOUNDED.1457552650000.json';
import myLargeSegmentRemovalMessage from '../mocks/message.MY_LARGE_SEGMENTS_UPDATE.SEGMENT_REMOVAL.1457552653000.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';
import authPushEnabledNicolasAndMarcio from '../mocks/auth.pushEnabled.nicolas@split.io.marcio@split.io.json';

import { nearlyEqual, url, hasNoCacheHeader } from '../testUtils';
import includes from 'lodash/includes';

// Replace original EventSource with mock
import EventSourceMock, { setMockListener } from '../testUtils/eventSourceMock';
window.EventSource = EventSourceMock;

import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const userKey = 'nicolas@split.io';
const otherUserKey = 'marcio@split.io';
const keylistAddKey = 'key1';
const keylistRemoveKey = 'key3';
const bitmapTrueKey = '88f8b33b-f858-4aea-bea2-a5f066bab3ce';

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
  sync: {
    largeSegmentsEnabled: true
  }
};
const settings = settingsFactory(config);

const MILLIS_SSE_OPEN = 100;
const MILLIS_FIRST_SPLIT_UPDATE_EVENT = 200;
const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 300;
const MILLIS_MY_SEGMENTS_UPDATE_EVENT_NO_PAYLOAD = 400;
const MILLIS_SPLIT_KILL_EVENT = 500;
const MILLIS_NEW_CLIENT = 600;
const MILLIS_SECOND_SSE_OPEN = 700;
const MILLIS_MY_SEGMENTS_UPDATE_WITH_PAYLOAD = 800;
const MILLIS_MY_SEGMENTS_UPDATE_WITH_EMPTY_PAYLOAD = 900;
const MILLIS_MORE_CLIENTS = 1000;
const MILLIS_UNBOUNDED_FETCH = 1100;
const MILLIS_BOUNDED_FALLBACK = 1200;
const MILLIS_KEYLIST_FALLBACK = 1300;
const MILLIS_BOUNDED = 1400;
const MILLIS_KEYLIST = 1500;
const MILLIS_SEGMENT_REMOVAL = 1600;
const MILLIS_UNBOUNDED_FETCH_LS = 1700;
const MILLIS_SEGMENT_REMOVAL_LS = 2100;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /mySegments/*, /myLargeSegments/*)
 *  0.2 secs: SPLIT_UPDATE event -> /splitChanges
 *  0.3 secs: SPLIT_UPDATE event with old changeNumber
 *  0.4 secs: MY_SEGMENTS_UPDATE event -> /mySegments/nicolas@split.io
 *  0.5 secs: SPLIT_KILL event -> /splitChanges
 *  0.6 secs: creates a new client -> new auth and SSE connection
 *  0.7 secs: SSE connection opened -> syncAll (/splitChanges, /mySegments/*, /myLargeSegments/*)
 *  0.8 secs: MY_SEGMENTS_UPDATE event for new client (with payload).
 *  0.9 secs: MY_SEGMENTS_UPDATE event for new client (with empty payload).
 *  1.0 secs: creates more clients
 *  1.1 secs: MY_SEGMENTS_UPDATE_V2 UnboundedFetchRequest event.
 *  1.2 secs: MY_SEGMENTS_UPDATE_V2 BoundedFetchRequest event error --> UnboundedFetchRequest.
 *  1.3 secs: MY_SEGMENTS_UPDATE_V2 KeyList event error --> UnboundedFetchRequest.
 *  1.4 secs: MY_SEGMENTS_UPDATE_V2 BoundedFetchRequest event.
 *  1.5 secs: MY_SEGMENTS_UPDATE_V2 KeyList event.
 *  1.6 secs: MY_SEGMENTS_UPDATE_V2 SegmentRemoval event.
 *  1.7 secs: MY_LARGE_SEGMENTS_UPDATE UnboundedFetchRequest event, with 241 ms delay for 'nicolas@split.io' (hash('nicolas@split.io') % 300)
 *  1.941 secs: /myLargeSegments/* fetch due to unbounded MY_LARGE_SEGMENTS_UPDATE event -> SPLIT_UPDATE event
 *  2.1 secs: MY_LARGE_SEGMENTS_UPDATE SegmentRemoval event -> SPLIT_UPDATE event
 */
export function testSynchronization(fetchMock, assert) {
  assert.plan(44);
  fetchMock.reset();

  let start, splitio, client, otherClient, keylistAddClient, keylistRemoveClient, bitmapTrueClient, sharedClients = [];

  // mock SSE open and message events
  setMockListener((eventSourceInstance) => {
    const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true&SplitSDKVersion=${settings.version}&SplitSDKClientKey=h-1>`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    /* events on first SSE connection */
    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

    setTimeout(() => {
      assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation of initial Split');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_FIRST_SPLIT_UPDATE_EVENT), 'SDK_UPDATE due to SPLIT_UPDATE event');
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
        assert.true(nearlyEqual(lapse, MILLIS_MY_SEGMENTS_UPDATE_EVENT_NO_PAYLOAD), 'SDK_UPDATE due to MY_SEGMENTS_UPDATE event');
        assert.equal(client.getTreatment('splitters'), 'on', 'evaluation with updated MySegments list');
      });
      eventSourceInstance.emitMessage(mySegmentsUpdateMessageNoPayload);
    }, MILLIS_MY_SEGMENTS_UPDATE_EVENT_NO_PAYLOAD); // send a MY_SEGMENTS_UPDATE event with a new changeNumber after 0.4 seconds

    setTimeout(() => {
      assert.equal(client.getTreatment('whitelist'), 'allowed', 'evaluation with not killed Split');
      const onUpdateCb = () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'SDK_UPDATE due to SPLIT_KILL event');
        assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation with killed Split');
      };
      // SPLIT_KILL triggers two SDK_UPDATE events. The 1st due to `killLocally` and the 2nd due to `/splitChanges` fetch
      client.once(client.Event.SDK_UPDATE, onUpdateCb);
      client.once(client.Event.SDK_UPDATE, onUpdateCb);
      eventSourceInstance.emitMessage(splitKillMessage);
    }, MILLIS_SPLIT_KILL_EVENT); // send a SPLIT_KILL event with a new changeNumber after 0.5 seconds

    setTimeout(() => {
      otherClient = splitio.client(otherUserKey);

      setMockListener((eventSourceInstance) => {
        const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_MjE0MTkxOTU2Mg%3D%3D_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_NTcwOTc3MDQx_mySegments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolasAndMarcio.token}&v=1.1&heartbeats=true&SplitSDKVersion=${settings.version}&SplitSDKClientKey=h-1>`;
        assert.equals(eventSourceInstance.url, expectedSSEurl, 'new EventSource URL is the expected');

        /* events on second SSE connection */
        setTimeout(() => {
          eventSourceInstance.emitOpen();
        }, MILLIS_SECOND_SSE_OPEN - MILLIS_NEW_CLIENT); // open new SSE connection

        setTimeout(() => {
          assert.equal(otherClient.getTreatment('qc_team'), 'no', 'evaluation with initial MySegments list (shared client)');
          otherClient.once(otherClient.Event.SDK_UPDATE, () => {
            const lapse = Date.now() - start;
            assert.true(nearlyEqual(lapse, MILLIS_MY_SEGMENTS_UPDATE_WITH_PAYLOAD), 'SDK_UPDATE due to MY_SEGMENTS_UPDATE event (with payload)');
            assert.equal(otherClient.getTreatment('qc_team'), 'yes', 'evaluation with updated MySegments list (shared client)');
          });
          eventSourceInstance.emitMessage(mySegmentsUpdateMessageWithPayload);
        }, MILLIS_MY_SEGMENTS_UPDATE_WITH_PAYLOAD - MILLIS_NEW_CLIENT); // send a MY_SEGMENTS_UPDATE event with payload after 0.1 seconds from new SSE connection opened

        setTimeout(() => {
          assert.equal(otherClient.getTreatment('qc_team'), 'yes', 'evaluation with updated MySegments list (shared client)');
          otherClient.once(otherClient.Event.SDK_UPDATE, () => {
            const lapse = Date.now() - start;
            assert.true(nearlyEqual(lapse, MILLIS_MY_SEGMENTS_UPDATE_WITH_EMPTY_PAYLOAD), 'SDK_UPDATE due to MY_SEGMENTS_UPDATE event (with empty payload)');
            assert.equal(otherClient.getTreatment('qc_team'), 'no', 'evaluation with re-updated MySegments list (shared client)');
          });

          // assert that user error on callback is an Uncaught Exception
          otherClient.once(otherClient.Event.SDK_UPDATE, () => {
            const previousErrorHandler = window.onerror;
            const exceptionHandler = err => {
              if (includes(err, 'willThrowFor')) {
                assert.pass(`User error on SDK_UPDATE callback should throw as Uncaught Exception: ${err}`);
              } else {
                assert.fail(err);
              }
              window.onerror = previousErrorHandler;
            };
            window.onerror = exceptionHandler;
            null.willThrowForUpdate();
          });
          eventSourceInstance.emitMessage(mySegmentsUpdateMessageWithEmptyPayload);
        }, MILLIS_MY_SEGMENTS_UPDATE_WITH_EMPTY_PAYLOAD - MILLIS_NEW_CLIENT); // send a MY_SEGMENTS_UPDATE event with payload after 0.1 seconds from new SSE connection opened

        setTimeout(() => {
          keylistAddClient = splitio.client(keylistAddKey);
          keylistRemoveClient = splitio.client(keylistRemoveKey);
          bitmapTrueClient = splitio.client(bitmapTrueKey);
          sharedClients = [otherClient, keylistAddClient, keylistRemoveClient, bitmapTrueClient];

          setMockListener((eventSourceInstance) => {
            eventSourceInstance.emitOpen();

            setTimeout(() => {
              eventSourceInstance.emitMessage(unboundedMessage);
            }, MILLIS_UNBOUNDED_FETCH - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              const malformedMessage = { ...boundedZlibMessage, data: boundedZlibMessage.data.replace('eJxiGAX4AMd', '').replace('1457552651000', '1457552650100') };
              eventSourceInstance.emitMessage(malformedMessage);
            }, MILLIS_BOUNDED_FALLBACK - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              const malformedMessage = { ...keylistGzipMessage, data: keylistGzipMessage.data.replace('H4sIAAAAAAA', '').replace('1457552652000', '1457552650200') };
              eventSourceInstance.emitMessage(malformedMessage);
            }, MILLIS_KEYLIST_FALLBACK - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'off', 'on', 'off'], 'evaluation before bounded fetch');
              bitmapTrueClient.once(bitmapTrueClient.Event.SDK_UPDATE, () => {
                assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'off', 'on', 'on'], 'evaluation after bounded fetch');
              });
              eventSourceInstance.emitMessage(boundedZlibMessage);
            }, MILLIS_BOUNDED - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'off', 'on', 'on'], 'evaluation before keylist message');
              keylistAddClient.once(keylistAddClient.Event.SDK_UPDATE, () => {
                // This callback executes first. Thus, the treatment for `keylistRemoveClient` is still 'on'
                assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'on', 'on', 'on'], 'evaluation after keylist message (added key)');
              });
              keylistRemoveClient.once(keylistRemoveClient.Event.SDK_UPDATE, () => {
                assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'on', 'off', 'on'], 'evaluation after keylist message (removed key)');
              });
              eventSourceInstance.emitMessage(keylistGzipMessage);
            }, MILLIS_KEYLIST - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'on', 'off', 'on'], 'evaluation before segment removal');
              bitmapTrueClient.once(bitmapTrueClient.Event.SDK_UPDATE, () => {
                assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'off', 'off', 'off'], 'evaluation after segment removal');
              });

              eventSourceInstance.emitMessage(segmentRemovalMessage);
            }, MILLIS_SEGMENT_REMOVAL - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.equal(client.getTreatment('in_large_segment'), 'no', 'evaluation before myLargeSegment fetch');

              const timestampUnboundEvent = Date.now();
              const EXPECTED_DELAY = 241;

              client.once(client.Event.SDK_UPDATE, () => {
                assert.true(nearlyEqual(Date.now() - timestampUnboundEvent, EXPECTED_DELAY), 'SDK_UPDATE after fetching myLargeSegments with a delay');
                assert.equal(client.getTreatment('in_large_segment'), 'yes', 'evaluation after myLargeSegment fetch');
              });

              eventSourceInstance.emitMessage(unboundedMyLargeSegmentsMessage);
            }, MILLIS_UNBOUNDED_FETCH_LS - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.equal(client.getTreatment('in_large_segment'), 'yes', 'evaluation before large segment removal');
              assert.deepEqual(sharedClients.map(c => c.getTreatment('in_large_segment')), ['no', 'no', 'no', 'no'], 'evaluation before segment removal');

              client.once(client.Event.SDK_UPDATE, () => {
                assert.equal(client.getTreatment('in_large_segment'), 'no', 'evaluation after large segment removal');

                // destroy shared clients and then main client
                Promise.all(sharedClients.map(c => c.destroy()))
                  .then(() => {
                    assert.equal(otherClient.getTreatment('whitelist'), 'control', 'evaluation returns control for shared client if it is destroyed');
                    assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation returns correct tratment for main client');
                    assert.equal(eventSourceInstance.readyState, EventSourceMock.OPEN, 'streaming is still open');

                    client.destroy().then(() => {
                      assert.equal(client.getTreatment('whitelist'), 'control', 'evaluation returns control for main client if it is destroyed');
                      assert.equal(eventSourceInstance.readyState, EventSourceMock.CLOSED, 'streaming is closed after destroy');
                      assert.end();
                    });
                  });
              });

              eventSourceInstance.emitMessage(myLargeSegmentRemovalMessage);
            }, MILLIS_SEGMENT_REMOVAL_LS - MILLIS_MORE_CLIENTS);
          });
        }, MILLIS_MORE_CLIENTS - MILLIS_NEW_CLIENT);

      });

    }, MILLIS_NEW_CLIENT); // creates a new client after 0.6 seconds

  });

  // initial auth
  let authParams = `users=${encodeURIComponent(userKey)}`;
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.1&${authParams}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabledNicolas };
  });

  // reauth due to new client
  authParams += `&users=${encodeURIComponent(otherUserKey)}`;
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.1&${authParams}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('second auth success');
    return { status: 200, body: authPushEnabledNicolasAndMarcio };
  });

  // reauth due to more clients
  authParams += `&users=${encodeURIComponent(keylistAddKey)}&users=${encodeURIComponent(keylistRemoveKey)}&users=${encodeURIComponent(bitmapTrueKey)}`;
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.1&${authParams}`), { status: 200, body: authPushEnabledNicolasAndMarcio });

  // initial sync
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=-1'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: splitChangesMock1 };
  });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: mySegmentsNicolasMock1 };
  });
  fetchMock.getOnce(url(settings, '/myLargeSegments/nicolas%40split.io'), { status: 200, body: { myLargeSegments: [] } });

  // split and segment sync after SSE opened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN), 'sync after SSE connection is opened');
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: mySegmentsNicolasMock1 };
  });
  fetchMock.getOnce(url(settings, '/myLargeSegments/nicolas%40split.io'), { status: 200, body: { myLargeSegments: [] } });

  // fetch due to SPLIT_UPDATE event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: splitChangesMock3 };
  });

  // fetch due to first MY_SEGMENTS_UPDATE event
  fetchMock.getOnce(url(settings, '/mySegments/nicolas%40split.io'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: mySegmentsNicolasMock2 };
  });

  // fetch due to SPLIT_KILL event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552649999'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation with split killed immediately, before fetch is done');
    return { status: 200, body: splitChangesMock4 };
  });

  // initial fetch of mySegments and myLargeSegments for new client
  fetchMock.getOnce(url(settings, '/mySegments/marcio%40split.io'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: mySegmentsMarcio };
  });
  fetchMock.getOnce(url(settings, '/myLargeSegments/marcio%40split.io'), { status: 200, body: { myLargeSegments: [] } });


  // sync after second SSE opened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552650000'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SECOND_SSE_OPEN), 'sync after second SSE connection is opened');
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: { splits: [], since: 1457552650000, till: 1457552650000 } };
  });
  fetchMock.get({ url: url(settings, '/mySegments/nicolas%40split.io'), repeat: 2 }, function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: mySegmentsNicolasMock2 };
  });
  fetchMock.get({ url: url(settings, '/mySegments/marcio%40split.io'), repeat: 2 }, function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: mySegmentsMarcio };
  });
  fetchMock.get({ url: url(settings, '/myLargeSegments/nicolas%40split.io'), repeat: 2 }, { status: 200, body: { myLargeSegments: [] } });
  fetchMock.get({ url: url(settings, '/myLargeSegments/marcio%40split.io'), repeat: 2 }, { status: 200, body: { myLargeSegments: [] } });

  // 3 unbounded fetch requests
  fetchMock.get({ url: url(settings, '/mySegments/nicolas%40split.io'), repeat: 3 }, function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: mySegmentsNicolasMock2 };
  });
  fetchMock.get({ url: url(settings, '/mySegments/marcio%40split.io'), repeat: 3 }, function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: mySegmentsMarcio };
  });

  // initial fetch of mySegments and myLargeSegments for other clients + sync after third SSE opened + 3 unbounded fetch requests for mySegments
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552650000'), { status: 200, body: { splits: [], since: 1457552650000, till: 1457552650000 } });
  fetchMock.get({ url: url(settings, '/mySegments/key1'), repeat: 5 }, { status: 200, body: { mySegments: [] } });
  fetchMock.get({ url: url(settings, '/mySegments/key3'), repeat: 5 }, { status: 200, body: { mySegments: [{ name: 'splitters' }] } });
  fetchMock.get({ url: url(settings, `/mySegments/${bitmapTrueKey}`), repeat: 5 }, { status: 200, body: { mySegments: [] } });
  fetchMock.get({ url: url(settings, '/myLargeSegments/key1'), repeat: 2 }, { status: 200, body: { myLargeSegments: [] } });
  fetchMock.get({ url: url(settings, '/myLargeSegments/key3'), repeat: 2 }, { status: 200, body: { myLargeSegments: [] } });
  fetchMock.get({ url: url(settings, `/myLargeSegments/${bitmapTrueKey}`), repeat: 2 }, { status: 200, body: { myLargeSegments: [] } });

  // bounded fetch request
  fetchMock.get(url(settings, `/mySegments/${bitmapTrueKey}`), { status: 200, body: { mySegments: [{ name: 'splitters' }] } });

  // unbounded myLargeSegments fetch requests
  fetchMock.getOnce(url(settings, '/myLargeSegments/nicolas%40split.io'), { status: 200, body: { myLargeSegments: ['employees', 'splitters'] } });
  fetchMock.getOnce(url(settings, '/myLargeSegments/marcio%40split.io'), { status: 200, body: { myLargeSegments: [] } });
  fetchMock.getOnce(url(settings, '/myLargeSegments/key1'), { status: 200, body: { myLargeSegments: [] } });
  fetchMock.getOnce(url(settings, '/myLargeSegments/key3'), { status: 200, body: { myLargeSegments: [] } });
  fetchMock.getOnce(url(settings, `/myLargeSegments/${bitmapTrueKey}`), { status: 200, body: { myLargeSegments: [] } });

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  fetchMock.post('*', 200);

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();

}
