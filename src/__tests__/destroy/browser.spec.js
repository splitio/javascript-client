import 'core-js/fn/promise';

import { SplitFactory } from '../../';
import tape from 'tape-catch';
import map from 'lodash/map';
import pick from 'lodash/pick';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import SettingsFactory from '../../utils/settings';

// Set the mock adapter on the default instance
const mock = new MockAdapter(axios);

const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

import splitChangesMock1 from './splitChanges.since.-1.json';
import splitChangesMock2 from './splitChanges.since.1500492097547.json';
import mySegmentsMock from './mySegments.json';
import impressionsMock from './impressions.json';

mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
mock.onGet(settings.url('/splitChanges?since=-1500492097547')).reply(200, splitChangesMock2);

mock.onGet(settings.url('/mySegments/ut1')).reply(200, mySegmentsMock);
mock.onGet(settings.url('/mySegments/ut2')).reply(200, mySegmentsMock);
mock.onGet(settings.url('/mySegments/ut3')).reply(200, mySegmentsMock);

tape('SDK destroy for BrowserJS', async function (assert) {
  const config = {
    core: {
      authorizationKey: 'fake-key',
      key: 'ut1'
    }
  };

  const factory = SplitFactory(config);
  const client = factory.client();
  const client2 = factory.client('ut2');
  const client3 = factory.client('ut3');

  const manager = factory.manager();

  // Events are shared between shared instances.
  assert.notOk(client.track('tt', 'eventType', 'invalid value' /* Invalid values are not tracked */));
  client.track('tt2', 'eventType', 1);
  client2.track('tt', 'eventType', 2);
  client3.track('tt2', 'otherEventType', 3);

  // Assert we are sending the impressions while doing the destroy
  mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(request => {
    const impressions = JSON.parse(request.data);

    impressions[0].keyImpressions = map(impressions[0].keyImpressions, imp => pick(imp, ['keyName', 'treatment']));

    assert.deepEqual(impressions, impressionsMock);

    return [200];
  });

  // Assert we are sending the events while doing the destroy
  mock.onPost(settings.url('/events/bulk')).replyOnce(request => {
    const events = JSON.parse(request.data);

    /* 3 events were pushed */
    assert.equal(events.length, 3, 'Should flush all events on destroy.');

    const firstEvent = events[0];
    const secondEvent = events[1];
    const thirdEvent = events[2];

    assert.equal(firstEvent.trafficTypeName, 'tt2', 'The flushed events should match the events on the queue.');
    assert.equal(firstEvent.eventTypeId, 'eventType', 'The flushed events should match the events on the queue.');
    assert.equal(firstEvent.value, 1, 'The flushed events should match the events on the queue.');
    assert.equal(secondEvent.trafficTypeName, 'tt', 'The flushed events should match the events on the queue.');
    assert.equal(secondEvent.eventTypeId, 'eventType', 'The flushed events should match the events on the queue.');
    assert.equal(secondEvent.value, 2, 'The flushed events should match the events on the queue.');
    assert.equal(thirdEvent.trafficTypeName, 'tt2', 'The flushed events should match the events on the queue.');
    assert.equal(thirdEvent.eventTypeId, 'otherEventType', 'The flushed events should match the events on the queue.');
    assert.equal(thirdEvent.value, 3, 'The flushed events should match the events on the queue.');

    return [200];
  });

  await client.ready();

  assert.equal(client.getTreatment('Single_Test'), 'on');
  assert.equal(client2.getTreatment('Single_Test'), 'on');
  assert.equal(client3.getTreatment('Single_Test'), 'on');
  assert.ok(manager.splits().length > 0, 'control assertion');
  assert.ok(manager.names().length > 0, 'control assertion');
  assert.ok(manager.split('Single_Test'), 'control assertion');

  await client3.destroy();
  assert.equal(client3.getTreatment('Single_Test'), 'control', 'After destroy, getTreatment returns control for every destroyed client.');
  assert.deepEqual(client3.getTreatments(['Single_Test']), { 'Single_Test': 'control' }, 'After destroy, getTreatments returns map of controls for every destroyed client.');
  assert.ok(manager.names().length > 0, 'control assertion');
  assert.notOk(client3.track('tt2', 'otherEventType', 3),  'After destroy, track calls return false.');

  await client2.destroy();
  assert.equal(client2.getTreatment('Single_Test'), 'control', 'After destroy, getTreatment returns control for every destroyed client.');
  assert.deepEqual(client2.getTreatments(['Single_Test']), { 'Single_Test': 'control' }, 'After destroy, getTreatments returns map of controls for every destroyed client.');
  assert.ok(manager.names().length > 0, 'control assertion');
  assert.notOk(client2.track('tt', 'eventType', 2),  'After destroy, track calls return false.');

  await client.destroy();
  assert.equal(client.getTreatment('Single_Test'), 'control', 'After destroy, getTreatment returns control for every destroyed client.');
  assert.deepEqual(client.getTreatments(['Single_Test']), { 'Single_Test': 'control' }, 'After destroy, getTreatments returns map of controls for every destroyed client.');
  assert.notOk(client2.track('tt2', 'eventType', 1),  'After destroy, track calls return false.');

  assert.equal(manager.splits().length, 0, 'After the main client is destroyed, manager.splits will return empty array');
  assert.equal(manager.names().length,  0, 'After the main client is destroyed, manager.names will return empty array');
  assert.equal(manager.split('Single_Test'), null, 'After the main client is destroyed, manager.split will return null');

  assert.end();
});
