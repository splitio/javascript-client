import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552649999.SPLIT_UPDATE.json';
import splitChangesMock4 from '../mocks/splitchanges.since.1457552649999.till.1457552650000.SPLIT_KILL.json';
import splitChangesMock5 from '../mocks/splitchanges.since.1457552650000.till.1457552650001.SPLIT_UPDATE.json';
import splitChangesMock6 from '../mocks/splitchanges.since.1684265694505.till.1684265694506.SPLIT_UPDATE.json';
import splitChangesMock7 from '../mocks/splitchanges.since.1684265694506.till.1684265694526.SPLIT_UPDATE.json';
import splitChangesMock8 from '../mocks/splitchanges.since.1684265694526.till.1684265694546.SPLIT_UPDATE.json';
import splitChangesMock9 from '../mocks/splitchanges.since.1684265694546.till.1684265694556.SPLIT_UPDATE.json';

import splitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552649999.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import segmentUpdateMessage from '../mocks/message.SEGMENT_UPDATE.1457552640000.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';
import splitUpdateWithNewSegmentsMessage from '../mocks/message.SPLIT_UPDATE.1457552650001.json';
import iffuSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.IFFU.1684265694505.json';
import iffuSplitUpdateMessageWrongCompressionCode from '../mocks/message.SPLIT_UPDATE.IFFU.1684265694515.json';
import iffuSplitUpdateMessageZeroPCN from '../mocks/message.SPLIT_UPDATE.IFFU.1684265694525.json';
import iffuSplitUpdateMessageMissingPCN from '../mocks/message.SPLIT_UPDATE.IFFU.1684265694545.json';
import iffuSplitUpdateMessageArchivedFF from '../mocks/message.SPLIT_UPDATE.IFFU.1684265694555.json';

import authPushEnabled from '../mocks/auth.pushEnabled.node.json';

import { nearlyEqual, mockSegmentChanges, url, hasNoCacheHeader } from '../testUtils';

import EventSourceMock, { setMockListener } from '../testUtils/eventSourceMock';
import { __setEventSource } from '../../platform/getEventSource/node';

import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const key = 'nicolas@split.io';
const otherUserKey = 'marcio@split.io';
const adminUserKey = 'admin';

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
  sync: {
    largeSegmentsEnabled: true // ignored in node
  }
};
const settings = settingsFactory(config);

const MILLIS_SSE_OPEN = 100;
const MILLIS_FIRST_SPLIT_UPDATE_EVENT = 200;
const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 300;
const MILLIS_SEGMENT_UPDATE_EVENT = 400;
const MILLIS_SPLIT_KILL_EVENT = 500;
const MILLIS_SPLIT_UPDATE_EVENT_WITH_NEW_SEGMENTS = 600;
const MILLIS_IFFU_UPDATE_EVENT_WITH_NEW_SEGMENTS = 700;
const MILLIS_IFFU_UPDATE_EVENT_WITH_WRONG_COMPRESS = 800;
const MILLIS_IFFU_UPDATE_EVENT_WITH_OLD_CHANGENUMBER = 900;
const MILLIS_IFFU_UPDATE_EVENT_WITH_ZERO_PCN = 1000;
const MILLIS_IFFU_UPDATE_EVENT_WITH_MISSING_PCN = 1100;
const MILLIS_IFFU_UPDATE_EVENT_WITH_ARCHIVED = 1200;
const MILLIS_DESTROY = 1300;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth, SSE connection
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /segmentChanges/*)
 *  0.2 secs: SPLIT_UPDATE event -> /splitChanges
 *  0.3 secs: SPLIT_UPDATE event with old changeNumber
 *  0.4 secs: SEGMENT_UPDATE event -> /segmentChanges/
 *  0.5 secs: SPLIT_KILL event -> /splitChanges
 *  0.6 secs: SPLIT_UPDATE event with new segments -> /splitChanges, /segmentChanges/{newSegments}
 *  0.7 secs: SPLIT_UPDATE IFFU event with new segments and Base64 encoded + Gzip (c==1) -> /segmentChanges/{newSegments}
 *  0.8 secs: SPLIT_UPDATE IFFU event with wrong compress code (c==3) -> /splitChanges
 *  0.9 secs: SPLIT_UPDATE IFFU event with old changeNumber
 *  1.0 secs: SPLIT_UPDATE IFFU event with pcn = 0 -> /splitChanges
 *  1.1 secs: SPLIT_UPDATE IFFU event with previous change number !== current change number -> /splitChanges
 *  1.2 secs: SPLIT_UPDATE IFFU event with ARCHIVED feature flag in notification and Base64 encoded + zLib (c==2) -> /splitChanges
 */
export function testSynchronization(fetchMock, assert) {
  assert.plan(49);
  fetchMock.reset();
  __setEventSource(EventSourceMock);

  let start, splitio, client, sdkUpdateCount = 0;

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    const expectedSSEurl = `${url(settings, '/sse')}?channels=NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_segments,NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw%3D%3D_splits,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_pri,%5B%3Foccupancy%3Dmetrics.publishers%5Dcontrol_sec&accessToken=${authPushEnabled.token}&v=1.1&heartbeats=true`;
    assert.equals(eventSourceInstance.url, expectedSSEurl, 'EventSource URL is the expected');
    assert.deepEqual(eventSourceInstance.__eventSourceInitDict.headers, {
      SplitSDKClientKey: 'h-1>',
      SplitSDKVersion: settings.version,
      SplitSDKMachineIP: settings.runtime.ip,
      SplitSDKMachineName: settings.runtime.hostname
    }, 'EventSource headers are the expected');

    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation of initial Split');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_FIRST_SPLIT_UPDATE_EVENT), 'SDK_UPDATE due to SPLIT_UPDATE event');
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
        assert.true(nearlyEqual(lapse, MILLIS_SEGMENT_UPDATE_EVENT), 'SDK_UPDATE due to SEGMENT_UPDATE event');
        assert.equal(client.getTreatment(key, 'splitters'), 'off', 'evaluation with updated segment');
      });
      eventSourceInstance.emitMessage(segmentUpdateMessage);
    }, MILLIS_SEGMENT_UPDATE_EVENT); // send a SEGMENT_UPDATE event with a new changeNumber after 0.4 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'whitelist'), 'allowed', 'evaluation with not killed Split');
      const onUpdateCb = () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_SPLIT_KILL_EVENT), 'SDK_UPDATE due to SPLIT_KILL event');
        assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation with killed Split');
      };
      // SPLIT_KILL triggers two SDK_UPDATE events. The 1st due to `killLocally` and the 2nd due to `/splitChanges` fetch
      client.once(client.Event.SDK_UPDATE, onUpdateCb);
      client.once(client.Event.SDK_UPDATE, onUpdateCb);
      eventSourceInstance.emitMessage(splitKillMessage);
    }, MILLIS_SPLIT_KILL_EVENT); // send a SPLIT_KILL event with a new changeNumber after 0.5 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'qc_team'), 'yes', 'evaluation previous to split update');
      assert.equal(client.getTreatment(otherUserKey, 'qc_team'), 'no', 'evaluation previous to split update');

      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_SPLIT_UPDATE_EVENT_WITH_NEW_SEGMENTS), 'SDK_UPDATE due to SPLIT_UPDATE event with new segments');
        assert.equal(client.getTreatment(key, 'qc_team'), 'no', 'evaluation of updated Split');
        assert.equal(client.getTreatment(otherUserKey, 'qc_team'), 'yes', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(splitUpdateWithNewSegmentsMessage);
    }, MILLIS_SPLIT_UPDATE_EVENT_WITH_NEW_SEGMENTS); // send a SPLIT_UPDATE event with new segments after 0.6 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'mauro_java'), 'control', 'evaluation previous to split update');
      assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'control', 'evaluation previous to split update');

      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_IFFU_UPDATE_EVENT_WITH_NEW_SEGMENTS), 'SDK_UPDATE due to SPLIT_UPDATE IFFU event');
        assert.equal(client.getTreatment(key, 'mauro_java'), 'off', 'evaluation of updated Split');
        assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'v5', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(iffuSplitUpdateMessage);
    }, MILLIS_IFFU_UPDATE_EVENT_WITH_NEW_SEGMENTS); // send a SPLIT_UPDATE event with new segments after 0.7 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'mauro_java'), 'off', 'evaluation previous to split update');
      assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'v5', 'evaluation of updated Split');

      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_IFFU_UPDATE_EVENT_WITH_WRONG_COMPRESS), 'SDK_UPDATE due to SPLIT_UPDATE IFFU event');
        assert.equal(client.getTreatment(key, 'mauro_java'), 'on', 'evaluation of updated Split');
        assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'v5', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(iffuSplitUpdateMessageWrongCompressionCode);
    }, MILLIS_IFFU_UPDATE_EVENT_WITH_WRONG_COMPRESS); // send a SPLIT_UPDATE event with wrong compress code after 0.8 seconds
    setTimeout(() => {
      eventSourceInstance.emitMessage(iffuSplitUpdateMessage);
    }, MILLIS_IFFU_UPDATE_EVENT_WITH_OLD_CHANGENUMBER); // send a SPLIT_UPDATE event with old change number after 0.9 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'mauro_java'), 'on', 'evaluation previous to split update');
      assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'v5', 'evaluation of updated Split');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_IFFU_UPDATE_EVENT_WITH_ZERO_PCN), 'SDK_UPDATE due to SPLIT_UPDATE IFFU event');
        assert.equal(client.getTreatment(key, 'mauro_java'), 'v5', 'evaluation of updated Split');
        assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'v4', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(iffuSplitUpdateMessageZeroPCN);
    }, MILLIS_IFFU_UPDATE_EVENT_WITH_ZERO_PCN); // send a SPLIT_UPDATE event with pcn = 0 after 1.0 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'mauro_java'), 'v5', 'evaluation previous to split update');
      assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'v4', 'evaluation of updated Split');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_IFFU_UPDATE_EVENT_WITH_MISSING_PCN), 'SDK_UPDATE due to SPLIT_UPDATE IFFU event');
        assert.equal(client.getTreatment(key, 'mauro_java'), 'off', 'evaluation of updated Split');
        assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'v4', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(iffuSplitUpdateMessageMissingPCN);
    }, MILLIS_IFFU_UPDATE_EVENT_WITH_MISSING_PCN); // send a SPLIT_UPDATE event with pcn = 0 after 1.1 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'mauro_java'), 'off', 'evaluation previous to split update');
      assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'v4', 'evaluation of updated Split');
      client.once(client.Event.SDK_UPDATE, () => {
        const lapse = Date.now() - start;
        assert.true(nearlyEqual(lapse, MILLIS_IFFU_UPDATE_EVENT_WITH_ARCHIVED), 'SDK_UPDATE due to SPLIT_UPDATE IFFU event');
        assert.equal(client.getTreatment(key, 'mauro_java'), 'control', 'evaluation of updated Split');
        assert.equal(client.getTreatment(adminUserKey, 'mauro_java'), 'control', 'evaluation of updated Split');
      });
      eventSourceInstance.emitMessage(iffuSplitUpdateMessageArchivedFF);
    }, MILLIS_IFFU_UPDATE_EVENT_WITH_ARCHIVED); // send a SPLIT_UPDATE event with pcn = 0 after 1.1 seconds

    setTimeout(() => {
      client.destroy().then(() => {
        assert.equal(client.getTreatment(key, 'whitelist'), 'control', 'evaluation returns control if client is destroyed');
        // @TODO SDK_UPDATE should be emitted 9 times, but currently it is being emitted twice on SPLIT_KILL
        assert.equal(sdkUpdateCount, 10, 'SDK_UPDATE should be emitted 10 times');
        assert.end();
      });
    }, MILLIS_DESTROY); // destroy client after 1.3 second
  });

  // initial auth
  fetchMock.getOnce(url(settings, '/v2/auth?s=1.1'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return { status: 200, body: authPushEnabled };
  });

  // initial split and segment sync
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=-1'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: splitChangesMock1 };
  });
  fetchMock.getOnce(url(settings, '/segmentChanges/splitters?since=-1'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: { since: -1, till: 1457552620999, name: 'splitters', added: [key], removed: [] } };
  });
  // extra retry due to double request (greedy fetch). @TODO: remove once `SplitChangesUpdaterFactory` and `segmentChangesFetcher` are updated
  fetchMock.getOnce(url(settings, '/segmentChanges/splitters?since=1457552620999'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] } };
  });

  // split and segment sync after SSE opened
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function (url, opts) {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN), 'sync after SSE connection is opened');
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: splitChangesMock2 };
  });
  fetchMock.getOnce(url(settings, '/segmentChanges/splitters?since=1457552620999'), function (url, opts) {
    if (hasNoCacheHeader(opts)) assert.fail('request must not include `Cache-Control` header');
    return { status: 200, body: { since: 1457552620999, till: 1457552620999, name: 'splitters', added: [], removed: [] } };
  });

  // fetch due to SPLIT_UPDATE event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552620999'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: splitChangesMock3 };
  });

  // fetch due to SEGMENT_UPDATE event
  fetchMock.getOnce(url(settings, '/segmentChanges/splitters?since=1457552620999'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: { since: 1457552620999, till: 1457552640000, name: 'splitters', added: [], removed: [key] } };
  });
  // extra retry (greedyFetch until since === till)
  fetchMock.getOnce(url(settings, '/segmentChanges/splitters?since=1457552640000'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: { since: 1457552640000, till: 1457552640000, name: 'splitters', added: [], removed: [] } };
  });

  // fetch due to SPLIT_KILL event
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552649999'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'evaluation with split killed immediately, before fetch is done');
    return { status: 200, body: splitChangesMock4 };
  });

  // fetch due to SPLIT_UPDATE event, with an update that involves a new segment
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1457552650000'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: splitChangesMock5 };
  });

  // fetch segments due to IFFU SPLIT_UPDATE event with new segments
  fetchMock.getOnce(url(settings, '/segmentChanges/maur-2?since=-1'), function () {
    return { status: 200, body: { since: 1457552650000, till: 1457552650000, name: 'maur-2', added: ['admin', 'mauro', 'nico'], removed: [] } };
  });

  // fetch feature flags due to IFFU SPLIT_UPDATE event with wrong compress code
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1684265694505'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: splitChangesMock6 };
  });

  // fetch feature flags due to IFFU SPLIT_UPDATE event with previous change number = 0
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1684265694506'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: splitChangesMock7 };
  });

  // fetch feature flags due to IFFU SPLIT_UPDATE event with previous change number !== current change number
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1684265694526'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: splitChangesMock8 };
  });

  // fetch feature flags due to IFFU SPLIT_UPDATE event with ARCHIVED feature flag
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=1684265694546'), function (url, opts) {
    if (!hasNoCacheHeader(opts)) assert.fail('request must include `Cache-Control` header');
    return { status: 200, body: splitChangesMock9 };
  });

  mockSegmentChanges(fetchMock, new RegExp(`${url(settings, '/segmentChanges')}/(employees|developers)`), [key]);
  mockSegmentChanges(fetchMock, { url: new RegExp(`${url(settings, '/segmentChanges')}/new_segment`), repeat: 2 }, [otherUserKey]);

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  fetchMock.post('*', 200);

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_UPDATE, () => sdkUpdateCount++);

}
