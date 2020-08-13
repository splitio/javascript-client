import tape from 'tape-catch';
import map from 'lodash/map';
import pick from 'lodash/pick';
import fetchMock from '../testUtils/fetchMock';
import { SplitFactory } from '../../index';
import SettingsFactory from '../../utils/settings';

const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  },
  streamingEnabled: false
});

import splitChangesMock1 from './splitChanges.since.-1.json';
import splitChangesMock2 from './splitChanges.since.1500492097547.json';
import impressionsMock from './impressions.json';

fetchMock.get(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
fetchMock.get(settings.url('/splitChanges?since=-1500492097547'), { status: 200, body: splitChangesMock2 });

tape('SDK destroy for NodeJS', async function (assert) {
  const config = {
    core: {
      authorizationKey: 'fake-key',
      key: 'facundo@split.io'
    },
    mode: 'standalone',
    streamingEnabled: false
  };

  const factory = SplitFactory(config);
  const client = factory.client();
  const manager = factory.manager();

  // Assert we are sending the impressions while doing the destroy
  fetchMock.postOnce(settings.url('/testImpressions/bulk'), (url, opts) => {
    const impressions = JSON.parse(opts.body);

    impressions[0].keyImpressions = map(impressions[0].keyImpressions, imp => pick(imp, ['keyName', 'treatment']));

    assert.deepEqual(impressions, impressionsMock);

    return 200;
  });

  // Events tracking do not need to wait for ready.
  client.track('nicolas.zelaya@split.io','tt', 'invalidEventType', 'invalid value' /* Invalid values are not tracked */);
  client.track('nicolas.zelaya@gmail.com','tt', 'validEventType', 1);

  // Assert we are sending the events while doing the destroy
  fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
    const events = JSON.parse(opts.body);

    assert.equal(events.length, 1, 'Should flush all events on destroy.');

    const firstEvent = events[0];

    assert.equal(firstEvent.key, 'nicolas.zelaya@gmail.com', 'The flushed events should match the events on the queue.');
    assert.equal(firstEvent.eventTypeId, 'validEventType', 'The flushed events should match the events on the queue.');

    return 200;
  });

  await client.ready();

  assert.equal(client.getTreatment('ut1', 'Single_Test'), 'on');
  assert.equal(client.getTreatment('ut2', 'Single_Test'), 'on');
  assert.equal(client.getTreatment('ut3', 'Single_Test'), 'on');

  const destroyPromise = client.destroy();

  assert.true(destroyPromise instanceof Promise, 'client.destroy() should return a promise.');

  await destroyPromise;

  assert.equal( client.getTreatment('ut1', 'Single_Test'), 'control', 'After destroy, getTreatment returns control.');
  assert.deepEqual( client.getTreatments('ut1', ['Single_Test', 'another_split']), {
    Single_Test: 'control', another_split: 'control'
  }, 'After destroy, getTreatments returns a map of control.');
  assert.notOk( client.track('key', 'tt', 'event'),  'After destroy, track calls return false.');
  assert.equal( manager.splits().length , 0 , 'After destroy, manager.splits returns empty array.');
  assert.equal( manager.names().length ,  0 , 'After destroy, manager.names returns empty array.');
  assert.equal( manager.split('Single_Test') , null , 'After destroy, manager.split returns null.');

  assert.end();
});
