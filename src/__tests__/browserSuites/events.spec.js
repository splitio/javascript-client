import { SplitFacade } from '../../';
import fetchMock from 'fetch-mock';
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

export function withoutBindingTT(assert) {
  const splitio = SplitFacade(baseSettings);
  const client = splitio.client();

  fetchMock.postOnce(settings.url('/events/bulk'), req => {
    const respPromise = req.json();

    // respPromise will resolve to the value we will send to BE.
    respPromise.then(resp => {
      // We will test the first and last item in detail.
      const firstEvent = resp[0];
      const lastEvent = resp[5];
      assert.equal(resp.length, 6, 'We had pushed 6 valid events, so we should post 6 items.');

      assert.equal(firstEvent.key, 'facundo@split.io', 'Key should match received value.');
      assert.equal(firstEvent.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
      assert.equal(firstEvent.trafficTypeName, 'someTrafficType', 'TrafficTypeName should match received value.');
      assert.equal(firstEvent.value, 10, 'Value should match the value received on the .track() function.');
      assert.equal(typeof firstEvent.timestamp, 'number', 'The timestamp should be a number.');

      assert.equal(lastEvent.key, 'facundo@split.io', 'Key should match received value.');
      assert.equal(lastEvent.eventTypeId, 'my.checkout.event', 'EventTypeId should match received value.');
      assert.equal(lastEvent.trafficTypeName, 'otherTraffictype', 'TrafficTypeName should match received value.');
      assert.equal(lastEvent.value, 0, 'Should have 0 as value because the value was invalid on the last event.');
      assert.equal(typeof lastEvent.timestamp, 'number', 'The timestamp should be a number.');

      client.destroy();
      assert.end();
    });

    return respPromise;
  });

  assert.ok(client.track, 'client.track should be defined.');
  assert.equal(typeof client.track, 'function', 'client.track should be a function.');

  // Key binded as with getTreatment.
  assert.ok(client.track('someTrafficType', 'someEvent', 10), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('someTrafficType', 'someEvent', 25), 'client.track returns true if an event is added to the queue.');

  // Invalid values will become a zero.
  assert.ok(client.track('otherTraffictype', 'anotherEvent', 'invalid value'), 'client.track returns true if an event is added to the queue, but if the value was invalid stores a 0.');
  assert.ok(client.track('otherTraffictype', 'randomEvent'), 'client.track returns true if an event is added to the queue, but if the value was invalid stores a 0.');
  assert.ok(client.track('otherTraffictype', 'genericEvent', null), 'client.track returns true if an event is added to the queue, but if the value was invalid stores a 0.');
  assert.ok(client.track('otherTraffictype', 'my.checkout.event', ['some', 'stuff']), 'client.track returns true if an event is added to the queue, but if the value was invalid stores a 0.');

  /* So far we've tracked 6 valid events */

  // Invalid events will not be queued.
  assert.notOk(client.track(), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track(10, 'someTrafficType', 'someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('asd', 20, 'trafficType'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
}

export function bindingTT(assert) {
  const localSettings = Object.assign({}, baseSettings);
  localSettings.core.trafficType = 'binded_tt';
  const splitio = SplitFacade(localSettings);
  const client = splitio.client();

  fetchMock.postOnce(settings.url('/events/bulk'), req => {
    const respPromise = req.json();

    // respPromise will resolve to the value we will send to BE.
    respPromise.then(resp => {
      // We will test the first and last item in detail.
      const firstEvent = resp[0];
      const lastEvent = resp[5];
      assert.equal(resp.length, 6, 'We had pushed 6 valid events, so we should post 6 items.');

      assert.equal(firstEvent.key, 'facundo@split.io', 'Key should match received value.');
      assert.equal(firstEvent.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
      assert.equal(firstEvent.trafficTypeName, 'binded_tt', 'TrafficTypeName should match the binded value.');
      assert.equal(firstEvent.value, 10, 'Value should match the value received on the .track() function.');
      assert.equal(typeof firstEvent.timestamp, 'number', 'The timestamp should be a number.');

      assert.equal(lastEvent.key, 'facundo@split.io', 'Key should match received value.');
      assert.equal(lastEvent.eventTypeId, 'my.checkout.event', 'EventTypeId should match received value.');
      assert.equal(lastEvent.trafficTypeName, 'binded_tt', 'TrafficTypeName should match the binded value.');
      assert.equal(lastEvent.value, 0, 'Should have 0 as value because the value was invalid on the last event.');
      assert.equal(typeof lastEvent.timestamp, 'number', 'The timestamp should be a number.');

      client.destroy();
      assert.end();

      return 200;
    });

    return respPromise;
  });

  assert.ok(client.track, 'client.track should be defined.');
  assert.equal(typeof client.track, 'function', 'client.track should be a function.');

  // Key binded as with getTreatment.
  assert.ok(client.track('someEvent', 10), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('someEvent', 25), 'client.track returns true if an event is added to the queue.');

  // Invalid values will become a zero.
  assert.ok(client.track('anotherEvent', 'invalid value'), 'client.track returns true if an event is added to the queue, but if the value was invalid stores a 0.');
  assert.ok(client.track('randomEvent'), 'client.track returns true if an event is added to the queue, but if the value was invalid stores a 0.');
  assert.ok(client.track('genericEvent', null), 'client.track returns true if an event is added to the queue, but if the value was invalid stores a 0.');
  assert.ok(client.track('my.checkout.event', ['some', 'stuff']), 'client.track returns true if an event is added to the queue, but if the value was invalid stores a 0.');

  /* So far we've tracked 6 valid events */

  // Invalid events will not be queued.
  assert.notOk(client.track(), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track(10, 'someTrafficType', 'someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
}
