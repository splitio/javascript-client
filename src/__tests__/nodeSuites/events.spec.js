
import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

const settings = SettingsFactory({
  core: {
    key: 'asd'
  }
});

const baseSettings = {
  core: {
    authorizationKey: '<some-token>'
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

export default function trackAssertions(mock, assert) {
  const splitio = SplitFactory(baseSettings);
  const client = splitio.client();

  mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
    const resp = JSON.parse(req.data);

    // We will test the first and last item in detail.
    const firstEvent = resp[0];
    const lastEvent = resp[3];
    assert.equal(resp.length, 4, 'We had pushed 4 valid events, so we should post 4 items.');

    assert.equal(firstEvent.key, 'nicolas@split.io', 'Key should match received value.');
    assert.equal(firstEvent.eventTypeId, 'someEvent', 'EventTypeId should match received value.');
    assert.equal(firstEvent.trafficTypeName, 'sometraffictype', 'TrafficTypeName should match received value in lowercases.');
    assert.equal(firstEvent.value, 10, 'Value should match the value received on the .track() function.');
    assert.equal(typeof firstEvent.timestamp, 'number', 'The timestamp should be a number.');

    assert.equal(lastEvent.key, 'marcio@split.io', 'Key should match received value.');
    assert.equal(lastEvent.eventTypeId, 'my.checkout.event', 'EventTypeId should match received value.');
    assert.equal(lastEvent.trafficTypeName, 'othertraffictype', 'TrafficTypeName should match received value in lowercases.');
    assert.equal(lastEvent.value, null, 'Should have null as value.');
    assert.equal(typeof lastEvent.timestamp, 'number', 'The timestamp should be a number.');

    client.destroy();
    assert.end();

    return [200];
  });

  assert.ok(client.track, 'client.track should be defined.');
  assert.equal(typeof client.track, 'function', 'client.track should be a function.');

  // Key binded as with getTreatment.
  assert.ok(client.track('nicolas@split.io', 'sometraffictype', 'someEvent', 10), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('nicolas@split.io', 'othertraffictype', 'genericEvent',  25), 'client.track returns true if event value is null and is added to the queue.');
  assert.ok(client.track('nicolas@split.io', 'othertraffictype', 'my.click.event'), 'client.track returns true if an event is added to the queue.');
  assert.ok(client.track('marcio@split.io', 'othertraffictype', 'my.checkout.event', null), 'client.track returns true if an event is added to the queue.');

  /* So far we've tracked 4 valid events */

  // Invalid events will not be queued.
  assert.notOk(client.track('facundo@split.io', 'othertraffictype', 'anotherEvent', 'invalid value'), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track('facundo@split.io', 'othertraffictype', 'my.checkout.event', ['some', 'stuff']), 'client.track returns false if event value is invalid and it could not be added to the queue.');
  assert.notOk(client.track(), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('facundo@split.io', 'someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('facundo@split.io', 10, 'sometraffictype', 'someEvent'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
  assert.notOk(client.track('facundo@split.io', 'asd', 20, 'trafficType'), 'client.track returns false if an event data was incorrect and it could not be added to the queue.');
}
