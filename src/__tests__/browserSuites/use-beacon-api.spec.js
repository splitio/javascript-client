import sinon from 'sinon';
import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';

const config = {
  core: {
    authorizationKey: '...',
    key: 'facundo@split.io'
  },
  urls: {
    sdk: 'https://sdk.baseurlbeacon',
    events: 'https://sdk.baseurlbeacon'
  }
};

const settings = SettingsFactory(config);

// Spy calls to Beacon API method
const sendBeaconSpy = sinon.spy(window.navigator,'sendBeacon');

// util method to trigger 'unload' event
function triggerUnloadEvent() {
  const event = document.createEvent('HTMLEvents');
  event.initEvent('unload', true, true);
  event.eventName = 'unload';
  window.dispatchEvent(event);
}

const assertImpressionSent = (assert, impression) => {
  assert.equal(impression.testName, 'hierarchical_splits_test', 'Present impression should have the correct split name.');
  assert.equal(impression.keyImpressions[0].keyName, 'facundo@split.io', 'Present impression should have the correct key.');
  assert.equal(impression.keyImpressions[0].label, 'expected label', 'Present impression should have the correct label.');
  assert.equal(impression.keyImpressions[0].treatment, 'on', 'Present impression should have the correct treatment.');
};

const assertEventSent = (assert, event) => {
  assert.equal(event.key, 'facundo@split.io', 'Key should match received value.');
  assert.equal(event.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
  assert.equal(event.trafficTypeName, 'sometraffictype', 'TrafficTypeName should match the binded value.');
};

const assertCallsToBeaconAPI = (assert) => {
  assert.ok(sendBeaconSpy.calledTwice, 'sendBeacon should have been called twice');

  // The first call is for flushing impressions
  const impressionsCallArgs = sendBeaconSpy.firstCall.args;
  assert.equal(impressionsCallArgs[0], settings.url('/testImpressions/beacon'), 'assert correct url');
  let parsedPayload = JSON.parse(impressionsCallArgs[1]);
  assert.equal(parsedPayload.token, '...', 'assert correct payload token');
  assert.equal(parsedPayload.sdk, settings.version, 'assert correct sdk version');
  assertImpressionSent(assert, parsedPayload.entries[0]);

  // The second call is for flushing events
  const eventsCallArgs = sendBeaconSpy.secondCall.args;
  assert.equal(eventsCallArgs[0], settings.url('/events/beacon'), 'assert correct url');
  parsedPayload = JSON.parse(eventsCallArgs[1]);
  assert.equal(parsedPayload.token, '...', 'assert correct payload token');
  assert.equal(parsedPayload.sdk, settings.version, 'assert correct sdk version');
  assertEventSent(assert, parsedPayload.entries[0]);
};

// This E2E test checks that Beacon API is not called when page unload is triggered and there are not events or impressions to send.
function beaconApiNotSendTest(mock, assert) {

  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
  mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);

  // Init and run Split client
  const splitio = SplitFactory(config);
  const client = splitio.client();
  client.on(client.Event.SDK_READY, () => {

    // trigger unload event, without tracked events and impressions
    triggerUnloadEvent();

    // queue the assertion of the Beacon requests, destruction of client and execution of the second E2E test named beaconApiSendTest
    setTimeout(() => {
      assert.ok(sendBeaconSpy.notCalled, 'sendBeacon should not be called if there are not events and impressions to track');
      sendBeaconSpy.resetHistory();

      client.destroy().then(()=>{
        beaconApiSendTest(mock,assert);
      });
    }, 0);
  });
}

// This E2E test checks that impressions and events are sent to backend via Beacon API when page unload is triggered.
function beaconApiSendTest(mock, assert) {

  // Init and run Split client
  const splitio = SplitFactory(config);
  const client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    client.getTreatment('hierarchical_splits_test');
    client.track('sometraffictype', 'someEvent', 10);

    // trigger unload event inmmediatly, before scheduled push of events and impressions
    triggerUnloadEvent();

    // queue the assertion of the Beacon requests, destruction of client and execution of the second E2E test named fallbackTest
    setTimeout(() => {
      
      assertCallsToBeaconAPI(assert);
      sendBeaconSpy.resetHistory();
      client.destroy().then(()=>{
        fallbackTest(mock,assert);
      });
    }, 0);
  });
}

// This E2E test checks that impressions and events are sent to backend via Axios when page unload is triggered and Beacon API is not available.
function fallbackTest(mock, assert) {

  // destroy reference to Beacon API
  window.navigator.sendBeacon = null;

  const splitio = SplitFactory(config);
  const client = splitio.client();

  // synchronize client destruction when both endpoints ('/testImpressions/bulk' and '/events/bulk') are called
  const finish = (function*() {
    yield;
    client.destroy().then(function(){
      assert.end();
    });
  })();
  
  // Mock endpoints used by Axios
  mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
    const resp = JSON.parse(req.data);
    assert.ok(req, 'Fallback to /testImpressions/bulk');
    assertImpressionSent(assert,resp[0]);
    finish.next();
    return [200];
  });
  mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
    const resp = JSON.parse(req.data);
    assert.ok(req, 'Fallback to /events/bulk');
    assertEventSent(assert,resp[0]);
    finish.next();
    return [200];
  });

  client.on(client.Event.SDK_READY, () => {
    client.getTreatment('hierarchical_splits_test');
    client.track('sometraffictype', 'someEvent', 10);
    // trigger unload event inmmediatly, before scheduled push of events and impressions
    triggerUnloadEvent();
  });
}

export default beaconApiNotSendTest;