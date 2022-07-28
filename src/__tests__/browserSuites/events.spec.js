import { SplitFactory } from '../../index';
import { settingsValidator } from '../../settings';
import { url } from '../testUtils';

const settings = settingsValidator({
  core: {
    key: 'asd'
  },
  streamingEnabled: false
});

const baseSettings = {
  core: {
    authorizationKey: '<some-token>',
    key: 'facundo@split.io'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 3000,
    eventsPushRate: 3000
  },
  startup: {
    eventsFirstPushWindow: 2
  },
  streamingEnabled: false
};

export function withoutBindingTT(fetchMock, assert) {
  const splitio = SplitFactory(baseSettings);
  const client = splitio.client();

  let tsStart, tsEnd;

  fetchMock.postOnce(url(settings, '/events/bulk'), (url, opts) => {
    const resp = JSON.parse(opts.body);

    // We will test the first and last item in detail.
    const firstEvent = resp[0];
    const midEvent = resp[3];
    const lastEvent = resp[5];
    assert.equal(resp.length, 6, 'We had pushed the same number of valid events as we have items.');

    assert.equal(firstEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(firstEvent.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
    assert.equal(firstEvent.trafficTypeName, 'sometraffictype', 'TrafficTypeName should match received value in lowercases.');
    assert.equal(firstEvent.value, 10, 'Value should match the value received on the .track() function.');
    assert.true(midEvent.timestamp >= tsStart && midEvent.timestamp <= tsEnd, 'The timestamp should be a number with the right value.');

    assert.equal(midEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(midEvent.eventTypeId, 'genericEvent', 'EventTypeId should match received value.');
    assert.equal(midEvent.trafficTypeName, 'othertraffictype', 'TrafficTypeName should match received value in lowercases.');
    assert.equal(midEvent.value, 24, 'Value should match the value received on the .track() function.');
    assert.true(midEvent.timestamp >= tsStart && midEvent.timestamp <= tsEnd, 'The timestamp should be a number with the right value.');
    assert.deepEqual(midEvent.properties, { prop1: true, prop2: 'a', prop3: 2, prop4: null, willBeNulled: null }, 'The properties should be correct.');

    assert.equal(lastEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(lastEvent.eventTypeId, 'my.checkout.event', 'EventTypeId should match received value.');
    assert.equal(lastEvent.trafficTypeName, 'othertraffictype', 'TrafficTypeName should match received value in lowercases.');
    assert.equal(lastEvent.value, null, 'Should have null as value.');
    assert.true(midEvent.timestamp >= tsStart && midEvent.timestamp <= tsEnd, 'The timestamp should be a number with the right value.');

    client.destroy();
    assert.end();

    return 200;
  });

  assert.ok(client.track, 'client.track should be defined.');
  assert.equal(typeof client.track, 'function', 'client.track should be a function.');

  // Key binded as with getTreatment.
  tsStart = Date.now();
  assert.ok(client.track('sometraffictype', 'someEvent', 10), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('othertraffictype', 'genericEvent',  25), 'client.track returns true if event value is null and is added to the queue.');
  assert.ok(client.track('othertraffictype', 'genericEvent',  25, null), 'client.track returns true if event properties is null and is added to the queue.');
  assert.ok(client.track('othertraffictype', 'genericEvent',  24, { prop1: true, prop2: 'a', prop3: 2, prop4: null, willBeNulled: {} }), 'client.track returns true if event properties is an object and is added to the queue.');
  assert.ok(client.track('othertraffictype', 'my.click.event'), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('othertraffictype', 'my.checkout.event', null), 'client.track returns true if an event is added to the queue.');
  tsEnd = Date.now();

  /* So far we've tracked 6 valid events */

  // Invalid events will not be queued.
  assert.notOk(client.track('othertraffictype', 'anotherEvent', 'invalid value'), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('othertraffictype', 'my.checkout.event', ['some', 'stuff']), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track(), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track(10, 'sometraffictype', 'someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('asd', 20, 'trafficType'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('othertraffictype', 'my.checkout.event', null, []), 'client.track returns false if an event properties was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('othertraffictype', 'my.checkout.event', null, function() {}), 'client.track returns false if an event properties was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('othertraffictype', 'my.checkout.event', null, 'asd'), 'client.track returns false if an event properties was incorrect and it could not be added to the queue.');
}

// Not for JS Browser SDK, because it doesn't let bind traffic types to clients
export function bindingTT(fetchMock, assert) {
  const localSettings = Object.assign({}, baseSettings);
  localSettings.core.trafficType = 'binded_tt';
  const splitio = SplitFactory(localSettings);
  const client = splitio.client();

  let tsStart, tsEnd;

  fetchMock.postOnce(url(settings, '/events/bulk'), (url, opts) => {
    const resp = JSON.parse(opts.body);

    // We will test the first and last item in detail.
    const firstEvent = resp[0];
    const midEvent = resp[3];
    const lastEvent = resp[5];
    assert.equal(resp.length, 6, 'We had pushed the same number of valid events as we have items.');

    assert.equal(firstEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(firstEvent.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
    assert.equal(firstEvent.trafficTypeName, 'binded_tt', 'TrafficTypeName should match the binded value.');
    assert.equal(firstEvent.value, 10, 'Value should match the value received on the .track() function.');
    assert.equal(typeof firstEvent.timestamp, 'number', 'The timestamp should be a number.');

    assert.equal(midEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(midEvent.eventTypeId, 'genericEvent', 'EventTypeId should match received value.');
    assert.equal(midEvent.trafficTypeName, 'binded_tt', 'TrafficTypeName should match received value in lowercases.');
    assert.equal(midEvent.value, 24, 'Value should match the value received on the .track() function.');
    assert.true(midEvent.timestamp >= tsStart && midEvent.timestamp <= tsEnd, 'The timestamp should be a number with the right value.');
    assert.deepEqual(midEvent.properties, { prop1: true, prop2: 'a', prop3: 2, prop4: null, willBeNulled: null }, 'The properties should be correct.');

    assert.equal(lastEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(lastEvent.eventTypeId, 'my.checkout.event', 'EventTypeId should match received value.');
    assert.equal(lastEvent.trafficTypeName, 'binded_tt', 'TrafficTypeName should match the binded value.');
    assert.equal(lastEvent.value, null, 'Should have null as value.');
    assert.equal(typeof lastEvent.timestamp, 'number', 'The timestamp should be a number.');

    client.destroy();
    assert.end();

    return 200;
  });

  assert.ok(client.track, 'client.track should be defined.');
  assert.equal(typeof client.track, 'function', 'client.track should be a function.');

  // Key binded as with getTreatment.
  tsStart = Date.now();
  assert.ok(client.track('someEvent', 10), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('genericEvent', 25), 'client.track returns true if an event is added to the queue');
  assert.ok(client.track('genericEvent',  25, null), 'client.track returns true if event properties is null and is added to the queue.');
  assert.ok(client.track('genericEvent',  24, { prop1: true, prop2: 'a', prop3: 2, prop4: null, willBeNulled: {} }), 'client.track returns true if event properties is an object and is added to the queue.');
  assert.ok(client.track('my.click.event'), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('my.checkout.event', null), 'client.track returns true if an event is added to the queue.');
  tsEnd = Date.now();

  /* So far we've tracked 6 valid events */

  // Invalid events will not be queued.
  assert.notOk(client.track(), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track(10, 'sometraffictype', 'someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('anotherEvent', 'invalid value'), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('randomEvent', 'invalid value'), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('my.checkout.event', ['some', 'stuff']), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('my.checkout.event', null, []), 'client.track returns false if an event properties was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('my.checkout.event', null, function() {}), 'client.track returns false if an event properties was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('my.checkout.event', null, 'asd'), 'client.track returns false if an event properties was incorrect and it could not be added to the queue.');
}
