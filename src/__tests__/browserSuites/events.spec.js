import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

const settings = SettingsFactory({
  core: {
    key: 'asd'
  }
});

const baseSettings = {
  core: {
    authorizationKey: '<some-token>',
    key: 'facundo@split.io'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000,
    eventsPushRate: 3000
  },
  startup: {
    eventsFirstPushWindow: 2
  }
};

export function withoutBindingTT(mock, assert) {
  const splitio = SplitFactory(baseSettings);
  const client = splitio.client();


  mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
    const resp = JSON.parse(req.data);

    // We will test the first and last item in detail.
    const firstEvent = resp[0];
    const lastEvent = resp[2];
    assert.equal(resp.length, 3, 'We had pushed 3 valid events, so we should post 3 items.');

    assert.equal(firstEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(firstEvent.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
    assert.equal(firstEvent.trafficTypeName, 'someTrafficType', 'TrafficTypeName should match received value.');
    assert.equal(firstEvent.value, 10, 'Value should match the value received on the .track() function.');
    assert.equal(typeof firstEvent.timestamp, 'number', 'The timestamp should be a number.');

    assert.equal(lastEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(lastEvent.eventTypeId, 'my.checkout.event', 'EventTypeId should match received value.');
    assert.equal(lastEvent.trafficTypeName, 'otherTraffictype', 'TrafficTypeName should match received value.');
    assert.equal(lastEvent.value, null, 'Should have null as value.');
    assert.equal(typeof lastEvent.timestamp, 'number', 'The timestamp should be a number.');

    client.destroy();
    assert.end();

    return [200];
  });

  assert.ok(client.track, 'client.track should be defined.');
  assert.equal(typeof client.track, 'function', 'client.track should be a function.');

  // Key binded as with getTreatment.
  assert.ok(client.track('someTrafficType', 'someEvent', 10), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('otherTraffictype', 'genericEvent',  25), 'client.track returns true if event value is null and is added to the queue.');
  assert.ok(client.track('otherTraffictype', 'my.checkout.event', null), 'client.track returns true if an event is added to the queue.');

  /* So far we've tracked 3 valid events */

  // Invalid events will not be queued.
  assert.notOk(client.track('otherTraffictype', 'anotherEvent', 'invalid value'), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('otherTraffictype', 'randomEvent'), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('otherTraffictype', 'my.checkout.event', ['some', 'stuff']), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track(), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track(10, 'someTrafficType', 'someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('asd', 20, 'trafficType'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
}

export function bindingTT(mock, assert) {
  const localSettings = Object.assign({}, baseSettings);
  localSettings.core.trafficType = 'binded_tt';
  const splitio = SplitFactory(localSettings);
  const client = splitio.client();

  mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
    const resp = JSON.parse(req.data);

    // We will test the first and last item in detail.
    const firstEvent = resp[0];
    const lastEvent = resp[2];
    assert.equal(resp.length, 3, 'We had pushed 3 valid events, so we should post 2 items.');

    assert.equal(firstEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(firstEvent.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
    assert.equal(firstEvent.trafficTypeName, 'binded_tt', 'TrafficTypeName should match the binded value.');
    assert.equal(firstEvent.value, 10, 'Value should match the value received on the .track() function.');
    assert.equal(typeof firstEvent.timestamp, 'number', 'The timestamp should be a number.');

    assert.equal(lastEvent.key, 'facundo@split.io', 'Key should match received value.');
    assert.equal(lastEvent.eventTypeId, 'my.checkout.event', 'EventTypeId should match received value.');
    assert.equal(lastEvent.trafficTypeName, 'binded_tt', 'TrafficTypeName should match the binded value.');
    assert.equal(lastEvent.value, null, 'Should have null as value.');
    assert.equal(typeof lastEvent.timestamp, 'number', 'The timestamp should be a number.');

    client.destroy();
    assert.end();

    return [200];
  });

  assert.ok(client.track, 'client.track should be defined.');
  assert.equal(typeof client.track, 'function', 'client.track should be a function.');

  // Key binded as with getTreatment.
  assert.ok(client.track('someEvent', 10), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('genericEvent', 25), 'client.track returns true if an event is added to the queue');
  assert.ok(client.track('my.checkout.event', null), 'client.track returns true if an event is added to the queue.');

  /* So far we've tracked 3 valid events */

  // Invalid events will not be queued.
  assert.notOk(client.track(), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track(10, 'someTrafficType', 'someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('anotherEvent', 'invalid value'), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('randomEvent'), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('my.checkout.event', ['some', 'stuff']), 'client.track returns false if event value is invalid and it could not be added to the queue.');
}
