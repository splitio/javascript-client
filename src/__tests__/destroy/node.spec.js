import { SplitFactory } from '../../';
import tape from 'tape';
import map from 'lodash/map';
import pick from 'lodash/pick';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// This sets the mock adapter on the default instance
const mock = new MockAdapter(axios);

import SettingsFactory from '../../utils/settings';
const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

import splitChangesMock1 from './splitChanges.since.-1.json';
import splitChangesMock2 from './splitChanges.since.1500492097547.json';
import impressionsMock from './impressions.json';

mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
mock.onGet(settings.url('/splitChanges?since=-1500492097547')).reply(200, splitChangesMock2);

tape('SDK destroy for NodeJS', async function (assert) {
  const config = {
    core: {
      authorizationKey: 'fake-key',
      key: 'facundo@split.io'
    },
    mode: 'standalone'
  };

  const factory = SplitFactory(config);
  const client = factory.client();
  const manager = factory.manager();

  // Assert we are sending the impressions while doing the destroy
  mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(request => {
    const impressions = JSON.parse(request.data);

    impressions[0].keyImpressions = map(impressions[0].keyImpressions, imp => pick(imp, ['keyName', 'treatment']));

    assert.deepEqual(impressions, impressionsMock);

    return [200];
  });

  // Events tracking do not need to wait for ready.
  client.track('nicolas.zelaya@split.io','tt', 'eventType' /* Invalid value is stored as 0 */);
  client.track('nicolas.zelaya@gmail.com','tt', 'otherEventType', 1);

  // Assert we are sending the events while doing the destroy
  mock.onPost(settings.url('/events/bulk')).replyOnce(request => {
    const events = JSON.parse(request.data);

    assert.equal(events.length, 2, 'Should flush all events on destroy.');

    const firstEvent = events[0];
    const secondEvent = events[1];

    assert.equal(firstEvent.key, 'nicolas.zelaya@split.io', 'The flushed events should match the events on the queue.');
    assert.equal(firstEvent.eventTypeId, 'eventType', 'The flushed events should match the events on the queue.');
    assert.equal(secondEvent.key, 'nicolas.zelaya@gmail.com', 'The flushed events should match the events on the queue.');
    assert.equal(secondEvent.eventTypeId, 'otherEventType', 'The flushed events should match the events on the queue.');

    return [200];
  });

  await client.ready();

  assert.equal(client.getTreatment('ut1', 'Single_Test'), 'on');
  assert.equal(client.getTreatment('ut2', 'Single_Test'), 'on');
  assert.equal(client.getTreatment('ut3', 'Single_Test'), 'on');

  const destroyPromise = client.destroy();

  assert.true(destroyPromise instanceof Promise, 'client.destroy() should return a promise.');

  await destroyPromise;

  assert.equal( client.getTreatment('ut1', 'Single_Test'), 'control' );

  assert.equal( manager.splits().length , 0 );
  assert.equal( manager.names().length ,  0 );
  assert.equal( manager.split('Single_Test') , null );

  mock.restore();

  assert.end();
});
