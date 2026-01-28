import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552649999.SPLIT_UPDATE.json';
import splitChangesMock4 from '../mocks/splitchanges.since.1457552649999.till.1457552650000.SPLIT_KILL.json';
import membershipsNicolasMock2 from '../mocks/memberships.nicolas@split.io.mock2.json';
import membershipsMarcio from '../mocks/memberships.marcio@split.io.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552649999.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';

import unboundedMessage from '../mocks/message.MEMBERSHIPS_MS_UPDATE.UNBOUNDED.1457552650000.json';
import boundedZlibMessage from '../mocks/message.MEMBERSHIPS_MS_UPDATE.BOUNDED.ZLIB.1457552651000.json';
import keylistGzipMessage from '../mocks/message.MEMBERSHIPS_MS_UPDATE.KEYLIST.GZIP.1457552652000.json';
import segmentRemovalMessage from '../mocks/message.MEMBERSHIPS_MS_UPDATE.SEGMENT_REMOVAL.1457552653000.json';
import unboundedLSMessage from '../mocks/message.MEMBERSHIPS_LS_UPDATE.UNBOUNDED.DELAY.1457552650000.json';
import segmentRemovalLSMessage from '../mocks/message.MEMBERSHIPS_LS_UPDATE.SEGMENT_REMOVAL.1457552653000.json';

import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';
import authPushEnabledNicolasAndMarcio from '../mocks/auth.pushEnabled.nicolas@split.io.marcio@split.io.json';

import { Backoff } from '@splitsoftware/splitio-commons/src/utils/Backoff';
import { nearlyEqual, url, hasNoCacheHeader } from '../testUtils';

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
};
const settings = settingsFactory(config);

const MILLIS_SSE_OPEN = 100;
const MILLIS_FIRST_SPLIT_UPDATE_EVENT = 200;
const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 300;
const MILLIS_SPLIT_KILL_EVENT = 400;
const MILLIS_NEW_CLIENT = 500;
const MILLIS_SECOND_SSE_OPEN = 600;
const MILLIS_MORE_CLIENTS = 700;
const MILLIS_MEMBERSHIPS_MS_UPDATE_UNBOUNDED_FETCH = 800;
const MILLIS_MEMBERSHIPS_MS_UPDATE_BOUNDED_FALLBACK = 900;
const MILLIS_MEMBERSHIPS_MS_UPDATE_KEYLIST_FALLBACK = 1000;
const MILLIS_MEMBERSHIPS_MS_UPDATE_BOUNDED = 1100;
const MILLIS_MEMBERSHIPS_MS_UPDATE_KEYLIST = 1200;
const MILLIS_MEMBERSHIPS_MS_UPDATE_SEGMENT_REMOVAL = 1300;
const MILLIS_MEMBERSHIPS_LS_UPDATE_UNBOUNDED_FETCH = 1400;
const MILLIS_MEMBERSHIPS_LS_UPDATE_SEGMENT_REMOVAL = 1900;
const EXPECTED_DELAY_AND_BACKOFF = 241 + 100;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /memberships/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /memberships/*)
 *  0.2 secs: SPLIT_UPDATE event -> /splitChanges
 *  0.3 secs: SPLIT_UPDATE event with old changeNumber
 *  0.4 secs: SPLIT_KILL event -> /splitChanges
 *  0.5 secs: creates a new client -> new auth and SSE connection
 *  0.6 secs: SSE connection opened -> syncAll (/splitChanges, /memberships/*)
 *  0.7 secs: creates more clients
 *  0.8 secs: MEMBERSHIPS_MS_UPDATE UnboundedFetchRequest event.
 *  0.9 secs: MEMBERSHIPS_MS_UPDATE BoundedFetchRequest event error --> UnboundedFetchRequest.
 *  1.0 secs: MEMBERSHIPS_MS_UPDATE KeyList event error --> UnboundedFetchRequest.
 *  1.1 secs: MEMBERSHIPS_MS_UPDATE BoundedFetchRequest event.
 *  1.2 secs: MEMBERSHIPS_MS_UPDATE KeyList event.
 *  1.3 secs: MEMBERSHIPS_MS_UPDATE SegmentRemoval event.
 *  1.4 secs: MEMBERSHIPS_LS_UPDATE UnboundedFetchRequest event, with 241 ms delay for 'nicolas@split.io' (hash('nicolas@split.io') % 300)
 *  1.641 secs: /memberships/* fetch due to unbounded MEMBERSHIPS_LS_UPDATE event, with an old changeNumber
 *  1.741 secs: /memberships/* fetch due to unbounded MEMBERSHIPS_LS_UPDATE event, with the target changeNumber -> SDK_UPDATE event
 *  1.9 secs: MEMBERSHIPS_LS_UPDATE SegmentRemoval event -> SPLIT_UPDATE event
 */
export function testSynchronization(fetchMock, assert) {
  // Force the backoff base of UpdateWorkers to reduce test time
  Backoff.__TEST__BASE_MILLIS = 100;
  assert.plan(39); // +3 for FLAGS_UPDATE metadata, +2 for SEGMENTS_UPDATE metadata
  fetchMock.reset();

  let start, splitio, client, otherClient, keylistAddClient, keylistRemoveClient, bitmapTrueClient, sharedClients = [];

  // mock SSE open and message events
  setMockListener((eventSourceInstance) => {
    const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_control,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_flags,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_memberships,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolas.token}&v=1.1&heartbeats=true&SplitSDKVersion=${settings.version}&SplitSDKClientKey=h-1>`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');

    /* events on first SSE connection */
    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

    setTimeout(() => {
      assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation of initial Split');
      client.once(client.Event.SDK_UPDATE, (metadata) => {
        assert.equal(metadata.type, 'FLAGS_UPDATE', 'SDK_UPDATE for SPLIT_UPDATE should have type FLAGS_UPDATE');
        assert.true(Array.isArray(metadata.names), 'metadata.names should be an array');
        assert.true(metadata.names.includes('whitelist'), 'metadata.names should include the updated whitelist split');
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
        const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_control,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_flags,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_memberships,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabledNicolasAndMarcio.token}&v=1.1&heartbeats=true&SplitSDKVersion=${settings.version}&SplitSDKClientKey=h-1>`;
        assert.equals(eventSourceInstance.url, expectedSSEurl, 'new EventSource URL is the expected');

        /* events on second SSE connection */
        setTimeout(() => {
          eventSourceInstance.emitOpen();
        }, MILLIS_SECOND_SSE_OPEN - MILLIS_NEW_CLIENT); // open new SSE connection

        setTimeout(() => {
          keylistAddClient = splitio.client(keylistAddKey);
          keylistRemoveClient = splitio.client(keylistRemoveKey);
          bitmapTrueClient = splitio.client(bitmapTrueKey);
          sharedClients = [otherClient, keylistAddClient, keylistRemoveClient, bitmapTrueClient];

          setMockListener((eventSourceInstance) => {
            eventSourceInstance.emitOpen();

            setTimeout(() => {
              eventSourceInstance.emitMessage(unboundedMessage);
            }, MILLIS_MEMBERSHIPS_MS_UPDATE_UNBOUNDED_FETCH - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              const malformedMessage = { ...boundedZlibMessage, data: boundedZlibMessage.data.replace('eJxiGAX4AMd', '').replace('1457552651000', '1457552650100') };
              eventSourceInstance.emitMessage(malformedMessage);
            }, MILLIS_MEMBERSHIPS_MS_UPDATE_BOUNDED_FALLBACK - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              const malformedMessage = { ...keylistGzipMessage, data: keylistGzipMessage.data.replace('H4sIAAAAAAA', '').replace('1457552652000', '1457552650200') };
              eventSourceInstance.emitMessage(malformedMessage);
            }, MILLIS_MEMBERSHIPS_MS_UPDATE_KEYLIST_FALLBACK - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'off', 'on', 'off'], 'evaluation before bounded fetch');
              bitmapTrueClient.once(bitmapTrueClient.Event.SDK_UPDATE, () => {
                assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'off', 'on', 'on'], 'evaluation after bounded fetch');
              });
              eventSourceInstance.emitMessage(boundedZlibMessage);
            }, MILLIS_MEMBERSHIPS_MS_UPDATE_BOUNDED - MILLIS_MORE_CLIENTS);

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
            }, MILLIS_MEMBERSHIPS_MS_UPDATE_KEYLIST - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'on', 'off', 'on'], 'evaluation before segment removal');
              bitmapTrueClient.once(bitmapTrueClient.Event.SDK_UPDATE, () => {
                assert.deepEqual(sharedClients.map(c => c.getTreatment('splitters')), ['off', 'off', 'off', 'off'], 'evaluation after segment removal');
              });

              eventSourceInstance.emitMessage(segmentRemovalMessage);
            }, MILLIS_MEMBERSHIPS_MS_UPDATE_SEGMENT_REMOVAL - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.equal(client.getTreatment('in_large_segment'), 'no', 'evaluation before myLargeSegment fetch');

              const timestampUnboundEvent = Date.now();

              client.once(client.Event.SDK_UPDATE, (metadata) => {
                assert.equal(metadata.type, 'SEGMENTS_UPDATE', 'SDK_UPDATE for MEMBERSHIPS_LS_UPDATE should have type SEGMENTS_UPDATE');
                assert.true(Array.isArray(metadata.names), 'metadata.names should be an array');
                assert.true(nearlyEqual(Date.now() - timestampUnboundEvent, EXPECTED_DELAY_AND_BACKOFF), 'SDK_UPDATE after fetching memberships with a delay');
                assert.equal(client.getTreatment('in_large_segment'), 'yes', 'evaluation after myLargeSegment fetch');
              });

              eventSourceInstance.emitMessage(unboundedLSMessage);
            }, MILLIS_MEMBERSHIPS_LS_UPDATE_UNBOUNDED_FETCH - MILLIS_MORE_CLIENTS);

            setTimeout(() => {
              assert.equal(client.getTreatment('in_large_segment'), 'yes', 'evaluation before large segment removal');
              assert.deepEqual(sharedClients.map(c => c.getTreatment('in_large_segment')), ['no', 'no', 'no', 'no'], 'evaluation before large segment removal');

              client.once(client.Event.SDK_UPDATE, () => {
                assert.equal(client.getTreatment('in_large_segment'), 'no', 'evaluation after large segment removal');

                // destroy shared clients and then main client
                Promise.all(sharedClients.map(c => c.destroy()))
                  .then(() => {
                    assert.equal(otherClient.getTreatment('whitelist'), 'control', 'evaluation returns control for shared client if it is destroyed');
                    assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation returns correct treatment for main client');
                    assert.equal(eventSourceInstance.readyState, EventSourceMock.OPEN, 'streaming is still open');

                    client.destroy().then(() => {
                      assert.equal(client.getTreatment('whitelist'), 'control', 'evaluation returns control for main client if it is destroyed');
                      assert.equal(eventSourceInstance.readyState, EventSourceMock.CLOSED, 'streaming is closed after destroy');

                      Backoff.__TEST__BASE_MILLIS = undefined;
                      assert.end();
                    });
                  });
              });

              eventSourceInstance.emitMessage(segmentRemovalLSMessage);
            }, MILLIS_MEMBERSHIPS_LS_UPDATE_SEGMENT_REMOVAL - MILLIS_MORE_CLIENTS);
          });
        }, MILLIS_MORE_CLIENTS - MILLIS_NEW_CLIENT);

      });

    }, MILLIS_NEW_CLIENT); // creates a new client after 0.6 seconds

  });

  // initial auth
  let authParams = `users=${encodeURIComponent(userKey)}`;
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.3&${authParams}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabledNicolas };
  });

  // reauth due to new client
  authParams += `&users=${encodeURIComponent(otherUserKey)}`;
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.3&${authParams}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('second auth success');
    return { status: 200, body: authPushEnabledNicolasAndMarcio };
  });

  // reauth due to more clients
  authParams += `&users=${encodeURIComponent(keylistAddKey)}&users=${encodeURIComponent(keylistRemoveKey)}&users=${encodeURIComponent(bitmapTrueKey)}`;
  fetchMock.getOnce(url(settings, `/v2/auth?s=1.3&${authParams}`), { status: 200, body: authPushEnabledNicolasAndMarcio });

  // initial sync
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: splitChangesMock1 };
  });
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: membershipsNicolasMock2 };
  });

  // sync all after SSE opened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=1457552620999&rbSince=100'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN), 'sync after SSE connection is opened');
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: membershipsNicolasMock2 };
  });

  // fetch due to SPLIT_UPDATE event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=1457552620999&rbSince=100'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: splitChangesMock3 };
  });

  // fetch due to SPLIT_KILL event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=1457552649999&rbSince=100'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    assert.equal(client.getTreatment('whitelist'), 'not_allowed', 'evaluation with split killed immediately, before fetch is done');
    return { status: 200, body: splitChangesMock4 };
  });

  // initial fetch of memberships for new client
  fetchMock.getOnce(url(settings, '/memberships/marcio%40split.io'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: membershipsMarcio };
  });

  // sync all after second SSE opened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=1457552650000&rbSince=100'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SECOND_SSE_OPEN), 'sync after second SSE connection is opened');
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: { ff: { d: [], s: 1457552650000, t: 1457552650000 } } };
  });
  fetchMock.get({ url: url(settings, '/memberships/nicolas%40split.io'), repeat: 2 }, function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: membershipsNicolasMock2 };
  });
  fetchMock.get({ url: url(settings, '/memberships/marcio%40split.io'), repeat: 2 }, function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: membershipsMarcio };
  });

  // 3 unbounded fetch for MEMBERSHIPS_MS_UPDATE + 1 unbounded fetch for MEMBERSHIPS_LS_UPDATE
  fetchMock.get({ url: url(settings, '/memberships/marcio%40split.io'), repeat: 4 }, function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: membershipsMarcio };
  });
  fetchMock.get({ url: url(settings, '/memberships/nicolas%40split.io'), repeat: 3 }, function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: membershipsNicolasMock2 };
  });
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), { status: 200, body: { ms: { k: [{ n: 'developers' }, { n: 'engineers' }] }, ls: { k: [], cn: 1457552640000 } } }); // not target changeNumber
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), { status: 200, body: { ms: { k: [{ n: 'developers' }, { n: 'engineers' }] }, ls: { k: [{ n: 'employees' }, { n: 'splitters' }], cn: 1457552650000 } } }); // target changeNumber

  // initial fetch of memberships for other clients + sync all after third SSE opened + 3 unbounded fetch for MEMBERSHIPS_MS_UPDATE + 1 unbounded fetch for MEMBERSHIPS_LS_UPDATE
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=1457552650000&rbSince=100'), { status: 200, body: { ff: { d: [], s: 1457552650000, t: 1457552650000 } } });
  fetchMock.get({ url: url(settings, '/memberships/key1'), repeat: 6 }, { status: 200, body: { ms: {} } });
  fetchMock.get({ url: url(settings, '/memberships/key3'), repeat: 6 }, { status: 200, body: { ms: { k: [{ n: 'splitters' }] } } });
  fetchMock.get({ url: url(settings, `/memberships/${bitmapTrueKey}`), repeat: 5 }, { status: 200, body: { ms: { k: [] } } });

  // bounded fetch request
  fetchMock.get(url(settings, `/memberships/${bitmapTrueKey}`), { status: 200, body: { ms: { k: [{ n: 'splitters' }] } } });

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  fetchMock.post('*', 200);

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();

}
