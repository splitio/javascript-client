import tape from 'tape';
import sinon from 'sinon';
import GaToSplit, { validateIdentities, defaultPrefix, defaultMapper, validateEventData, fixEventTypeId } from '../GaToSplit';
import { gaMock, gaRemove, modelMock } from './gaMock';

const hitSample = {
  hitType: 'pageview',
  page: '/path',
};
const modelSample = modelMock(hitSample);
const expectedDefaultEvent = {
  eventTypeId: 'pageview',
  value: undefined,
  properties: { page: hitSample.page },
  timestamp: 0,
};

tape('validateIdentities', assert => {
  assert.deepEqual(validateIdentities(undefined), []);
  assert.deepEqual(validateIdentities(null), []);
  assert.deepEqual(validateIdentities(123), []);
  assert.deepEqual(validateIdentities(true), []);
  assert.deepEqual(validateIdentities('something'), []);
  assert.deepEqual(validateIdentities({}), []);
  assert.deepEqual(validateIdentities(/asd/ig), []);
  assert.deepEqual(validateIdentities(function () { }), []);

  assert.deepEqual(validateIdentities([]), []);
  assert.deepEqual(validateIdentities([undefined, /asd/ig, function () { }]), []);
  assert.deepEqual(validateIdentities([{
    key: 'key', trafficType: 'user' // First occurence of this item
  }, {
    key: 'key', trafficType: function () { } // Invalid item (invalid TT)
  }, {
    key: 'keyu', trafficType: 'ser' // First occurence of this item
  }, {
    key: true, trafficType: 'user' // Invalid item (invalid key)
  }, {
    key: 'key2', trafficType: 'user2' // First occurence of this item
  }, {
    key: 12, trafficType: 'user' // First occurence of this item
  }, {
    key: 'key', trafficType: 'user' // Duplicated item
  },
  {} // Invalid item (undefined key and traffic type)
  ]), [{
    key: 'key', trafficType: 'user'
  }, {
    key: 'keyu', trafficType: 'ser'
  }, {
    key: 'key2', trafficType: 'user2'
  }, {
    key: 12, trafficType: 'user'
  }]);
  assert.end();
});

tape('validateEventData', assert => {
  assert.throws(() => { validateEventData(undefined); }, 'throws exception if passed object is undefined');
  assert.throws(() => { validateEventData(null); }, 'throws exception if passed object is null');

  assert.equal(validateEventData({}), true, 'does not validates eventTypeId');
  assert.equal(validateEventData({ eventTypeId: 'type' }), true, 'does not validates eventTypeId');
  assert.equal(validateEventData({ eventTypeId: 123 }), true, 'does not validates eventTypeId');

  assert.equal(validateEventData({ eventTypeId: 'type', value: 'value' }), false, 'event must have a valid value if present');
  assert.equal(validateEventData({ eventTypeId: 'type', value: 0 }), true, 'event must have a valid value if present');

  assert.equal(validateEventData({ eventTypeId: 'type', properties: ['prop1'] }), false, 'event must have valid properties if present');
  assert.equal(validateEventData({ eventTypeId: 'type', properties: { prop1: 'prop1' } }), true, 'event must have valid properties if present');

  assert.equal(validateEventData({ eventTypeId: 'type', timestamp: true }), false, 'event must have a valid timestamp if present');
  assert.equal(validateEventData({ eventTypeId: 'type', timestamp: Date.now() }), true, 'event must have a valid timestamp if present');

  assert.equal(validateEventData({ eventTypeId: 'type', key: true }), false, 'event must have a valid key if present');
  assert.equal(validateEventData({ eventTypeId: 'type', key: 'key' }), true, 'event must have a valid key if present');

  assert.equal(validateEventData({ eventTypeId: 'type', trafficTypeName: true }), false, 'event must have a valid trafficTypeName if present');
  assert.equal(validateEventData({ eventTypeId: 'type', trafficTypeName: 'tt' }), true, 'event must have a valid trafficTypeName if present');

  assert.end();
});

tape('fixEventTypeId', assert => {
  const DEFAULT_EVENT_TYPE = 'event';
  assert.equal(fixEventTypeId(undefined), DEFAULT_EVENT_TYPE);
  assert.equal(fixEventTypeId(111), DEFAULT_EVENT_TYPE);
  assert.equal(fixEventTypeId(''), DEFAULT_EVENT_TYPE);
  assert.equal(fixEventTypeId('()'), DEFAULT_EVENT_TYPE);
  assert.equal(fixEventTypeId('()+_'), DEFAULT_EVENT_TYPE);
  assert.equal(fixEventTypeId('  some   event '), 'some_event_');
  assert.equal(fixEventTypeId('  -*- some  -.%^ event =+ '), 'some_-._event_');
  assert.end();
});

tape('defaultMapper', assert => {
  const initTimestamp = Date.now();
  const defaultEvent = defaultMapper(modelSample);

  assert.equal(defaultEvent.eventTypeId, expectedDefaultEvent.eventTypeId, 'should return the corresponding default event instance for a given pageview hit');
  assert.equal(defaultEvent.value, expectedDefaultEvent.value);
  assert.deepEqual(defaultEvent.properties, expectedDefaultEvent.properties);
  assert.true(initTimestamp <= defaultEvent.timestamp && defaultEvent.timestamp <= Date.now());

  assert.end();
});

const sdkOptions = {
  type: 'GOOGLE_ANALYTICS_TO_SPLIT',
};
const coreSettings = {
  key: 'key',
  trafficType: 'user',
};
const fakeStorage = {
  events: {
    track: sinon.stub()
  }
};
// Returns a new event by copying defaultEvent
function customMapper(model, defaultEvent) {
  return { ...defaultEvent, properties: { ...defaultEvent.properties, someProp: 'someProp' } };
}
// Updates defaultEvent
function customMapper2(model, defaultEvent) {
  defaultEvent.properties.someProp2 = 'someProp2';
  return defaultEvent;
}
function customFilter() {
  return true;
}
const customIdentities = [{ key: 'key2', trafficType: 'tt2' }];

tape('GaToSplit', assert => {

  // test setup
  const { ga, tracker } = gaMock();

  // provide SplitTracker plugin
  GaToSplit(sdkOptions, fakeStorage, coreSettings);
  assert.true(ga.calledWith('provide', 'splitTracker'));
  let SplitTracker = ga.lastCall.args[2];
  assert.true(typeof SplitTracker === 'function');

  /** Default behavior */

  // init plugin on default tracker. equivalent to calling `ga('require', 'splitTracker')`
  new SplitTracker(tracker);

  // send hit and assert that it was properly tracked as a Split event
  window.ga('send', hitSample);
  let event = fakeStorage.events.track.lastCall.args[0];
  assert.deepEqual(event,
    {
      ...expectedDefaultEvent,
      eventTypeId: defaultPrefix + '.' + expectedDefaultEvent.eventTypeId,
      key: coreSettings.key,
      trafficTypeName: coreSettings.trafficType,
      timestamp: event.timestamp,
    }, 'should track an event using the default mapper and key and traffic type from the SDK config');

  /** Custom behavior: plugin options */

  // init plugin with custom options
  new SplitTracker(tracker, { mapper: customMapper, filter: customFilter, identities: customIdentities, prefix: '' });

  // send hit and assert that it was properly tracked as a Split event
  window.ga('send', hitSample);
  event = fakeStorage.events.track.lastCall.args[0];
  assert.deepEqual(event,
    {
      ...customMapper(modelSample, defaultMapper(modelSample)),
      key: customIdentities[0].key,
      trafficTypeName: customIdentities[0].trafficType,
      timestamp: event.timestamp,
    }, 'should track an event using a custom mapper and identity from the plugin options');

  /** Custom behavior: SDK options */

  // provide a new SplitTracker plugin with custom SDK options
  GaToSplit({
    type: 'GOOGLE_ANALYTICS_TO_SPLIT', mapper: customMapper2, filter: customFilter, identities: customIdentities, prefix: '', events: true
  }, fakeStorage, coreSettings);
  assert.true(ga.lastCall.calledWith('provide', 'splitTracker'));
  SplitTracker = ga.lastCall.args[2];
  assert.true(typeof SplitTracker === 'function');

  // init plugin
  new SplitTracker(tracker);

  // send hit and assert that it was properly tracked as a Split event
  window.ga('send', hitSample);
  event = fakeStorage.events.track.lastCall.args[0];
  assert.deepEqual(event,
    {
      ...customMapper2(modelSample, defaultMapper(modelSample)),
      key: customIdentities[0].key,
      trafficTypeName: customIdentities[0].trafficType,
      timestamp: event.timestamp,
    }, 'should track the event using a custom mapper and identity from the SDK options');

  // test teardown
  gaRemove();
  assert.end();
});

tape('GaToSplit: `events` flag param', assert => {

  // test setup
  const { ga, tracker } = gaMock();
  GaToSplit(sdkOptions, fakeStorage, coreSettings);
  let SplitTracker = ga.lastCall.args[2];

  // init plugin with custom options
  new SplitTracker(tracker, { events: false });

  // send hit and assert that it was not tracked as a Split event
  fakeStorage.events.track.resetHistory();
  window.ga('send', hitSample);
  assert.true(fakeStorage.events.track.notCalled);

  // test teardown
  gaRemove();
  assert.end();
});