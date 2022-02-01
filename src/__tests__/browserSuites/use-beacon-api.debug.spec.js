import sinon from 'sinon';
import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';
import { DEBUG } from '@splitsoftware/splitio-commons/src/utils/constants';
import { url } from '../testUtils';
import { triggerUnloadEvent } from '../testUtils/browser';

const config = {
  core: {
    authorizationKey: '...',
    key: 'facundo@split.io'
  },
  urls: {
    sdk: 'https://sdk.baseurlbeacondebug',
    events: 'https://sdk.baseurlbeacondebug'
  },
  streamingEnabled: false,
  sync: {
    impressionsMode: DEBUG
  }
};

const settings = settingsFactory(config);

// Spy calls to Beacon API method
let sendBeaconSpyDebug;

const assertImpressionSent = (assert, impression) => {
  assert.equal(impression.f, 'hierarchical_splits_test', 'Present impression should have the correct split name.');
  assert.equal(impression.i[0].k, 'facundo@split.io', 'Present impression should have the correct key.');
  assert.equal(impression.i[0].r, 'expected label', 'Present impression should have the correct label.');
  assert.equal(impression.i[0].t, 'on', 'Present impression should have the correct treatment.');
};

const assertEventSent = (assert, event) => {
  assert.equal(event.key, 'facundo@split.io', 'Key should match received value.');
  assert.equal(event.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
  assert.equal(event.trafficTypeName, 'sometraffictype', 'TrafficTypeName should match the binded value.');
};

const assertCallsToBeaconAPI = (assert) => {
  assert.ok(sendBeaconSpyDebug.calledTwice, 'sendBeacon should have been called twice');

  // The first call is for flushing impressions
  const impressionsCallArgs = sendBeaconSpyDebug.firstCall.args;
  assert.equal(impressionsCallArgs[0], url(settings, '/testImpressions/beacon'), 'assert correct url');
  let parsedPayload = JSON.parse(impressionsCallArgs[1]);
  assert.equal(parsedPayload.token, '...', 'assert correct payload token');
  assert.equal(parsedPayload.sdk, settings.version, 'assert correct sdk version');
  assert.equal(parsedPayload.sim, DEBUG, 'assert correct impressions mode');
  assertImpressionSent(assert, parsedPayload.entries[0]);

  // The second call is for flushing events
  const eventsCallArgs = sendBeaconSpyDebug.secondCall.args;
  assert.equal(eventsCallArgs[0], url(settings, '/events/beacon'), 'assert correct url');
  parsedPayload = JSON.parse(eventsCallArgs[1]);
  assert.equal(parsedPayload.token, '...', 'assert correct payload token');
  assert.equal(parsedPayload.sdk, settings.version, 'assert correct sdk version');
  assertEventSent(assert, parsedPayload.entries[0]);
};

// This E2E test checks that Beacon API is not called when page unload is triggered and there are not events or impressions to send.
function beaconApiNotSendTestDebug(fetchMock, assert) {
  sendBeaconSpyDebug = sinon.spy(window.navigator, 'sendBeacon');

  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.get(url(settings, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?since=1457552620999'), { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
  fetchMock.get(url(settings, '/mySegments/facundo%40split.io'), { status: 200, body: mySegmentsFacundo });

  // Init and run Split client
  const splitio = SplitFactory(config);
  const client = splitio.client();
  client.on(client.Event.SDK_READY, () => {

    // trigger unload event, without tracked events and impressions
    triggerUnloadEvent();

    // destroy the client and execute the next E2E test named beaconApiSendTest
    setTimeout(() => {
      assert.ok(sendBeaconSpyDebug.notCalled, 'sendBeacon should not be called if there are not events and impressions to track');
      sendBeaconSpyDebug.resetHistory();

      client.destroy().then(() => {
        beaconApiSendTestDebug(fetchMock, assert);
      });
    }, 0);
  });
}

// This E2E test checks that impressions and events are sent to backend via Beacon API when page unload is triggered.
function beaconApiSendTestDebug(fetchMock, assert) {

  // Init and run Split client
  const splitio = SplitFactory(config);
  const client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    client.getTreatment('hierarchical_splits_test');
    client.track('sometraffictype', 'someEvent', 10);

    // trigger unload event inmmediatly, before scheduled push of events and impressions
    triggerUnloadEvent();

    // queue the assertion of the Beacon requests, destroy the client and execute the next E2E test named fallbackTest
    setTimeout(() => {

      assertCallsToBeaconAPI(assert);
      sendBeaconSpyDebug.resetHistory();
      client.destroy().then(() => {
        fallbackTest(fetchMock, assert);
      });
    }, 0);
  });
}

// This E2E test checks that impressions and events are sent to backend via Axios when page unload is triggered and Beacon API is not available.
function fallbackTest(fetchMock, assert) {

  // destroy reference to Beacon API
  window.navigator.sendBeacon = null;

  const splitio = SplitFactory(config);
  const client = splitio.client();

  // synchronize client destruction when both endpoints ('/testImpressions/bulk' and '/events/bulk') are called
  const finish = (function* () {
    yield;
    // @TODO review why we must destroy client in a different event-loop cycle, compared to axios-mock-adapter
    setTimeout(function () {
      client.destroy().then(function () {
        sendBeaconSpyDebug.restore();
        assert.end();
      });
    }, 0);
  })();

  // Mock endpoints used by Axios
  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, opts) => {
    const resp = JSON.parse(opts.body);
    assert.ok(opts, 'Fallback to /testImpressions/bulk');
    assertImpressionSent(assert, resp[0]);
    finish.next();
    return 200;
  });
  fetchMock.postOnce(url(settings, '/events/bulk'), (url, opts) => {
    const resp = JSON.parse(opts.body);
    assert.ok(opts, 'Fallback to /events/bulk');
    assertEventSent(assert, resp[0]);
    finish.next();
    return 200;
  });

  client.on(client.Event.SDK_READY, () => {
    client.getTreatment('hierarchical_splits_test');
    client.track('sometraffictype', 'someEvent', 10);
    // trigger unload event inmmediatly, before scheduled push of events and impressions
    triggerUnloadEvent();
  });
}

export default beaconApiNotSendTestDebug;
