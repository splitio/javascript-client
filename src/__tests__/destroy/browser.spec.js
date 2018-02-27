import tape from 'tape';
import map from 'lodash/map';
import pick from 'lodash/pick';
import { SplitFactory } from '../../';
import fetchMock from 'fetch-mock';
import SettingsFactory from '../../utils/settings';
const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

import splitChangesMock1 from './splitChanges.since.-1.json';
import splitChangesMock2 from './splitChanges.since.1500492097547.json';
import mySegmentsMock from './mySegments.json';
import impressionsMock from './impressions.json';

const delayResponse = mock => {
  return new Promise(res => setTimeout(res, 0)).then(() => mock);
};

fetchMock.mock(settings.url('/splitChanges?since=-1'), () => delayResponse(splitChangesMock1));
fetchMock.mock(settings.url('/splitChanges?since=1500492097547'), () => delayResponse(splitChangesMock2));

fetchMock.mock(settings.url('/mySegments/ut1'), () => delayResponse(mySegmentsMock));
fetchMock.mock(settings.url('/mySegments/ut2'), () => delayResponse(mySegmentsMock));
fetchMock.mock(settings.url('/mySegments/ut3'), () => delayResponse(mySegmentsMock));

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
  assert.true(client.track('tt', 'eventType' /* Invalid value is stored as 0 */));
  client.track('tt2', 'eventType', 1);
  client2.track('tt', 'eventType', 2);
  client3.track('tt2', 'otherEventType', 3);

  // Assert we are sending the impressions while doing the destroy
  fetchMock.post(settings.url('/testImpressions/bulk'), request => {
    return request.json().then(impressions => {
      impressions[0].keyImpressions = map(impressions[0].keyImpressions, imp => pick(imp, ['keyName', 'treatment']));

      assert.deepEqual(impressions, impressionsMock);

      return 200;
    });
  });

  // Assert we are sending the events while doing the destroy
  fetchMock.post(settings.url('/events/bulk'), request => {
    return request.json().then(events => {
      /* 4 events were pushed */
      assert.equal(events.length, 4, 'Should flush all events on destroy.');

      const firstEvent = events[0];
      const secondEvent = events[1];
      const thirdEvent = events[2];
      const fourthEvent = events[3];

      assert.equal(firstEvent.trafficTypeName, 'tt', 'The flushed events should match the events on the queue.');
      assert.equal(firstEvent.eventTypeId, 'eventType', 'The flushed events should match the events on the queue.');
      assert.equal(firstEvent.value, 0, 'The flushed events should match the events on the queue.');
      assert.equal(secondEvent.trafficTypeName, 'tt2', 'The flushed events should match the events on the queue.');
      assert.equal(secondEvent.eventTypeId, 'eventType', 'The flushed events should match the events on the queue.');
      assert.equal(secondEvent.value, 1, 'The flushed events should match the events on the queue.');
      assert.equal(thirdEvent.trafficTypeName, 'tt', 'The flushed events should match the events on the queue.');
      assert.equal(thirdEvent.eventTypeId, 'eventType', 'The flushed events should match the events on the queue.');
      assert.equal(thirdEvent.value, 2, 'The flushed events should match the events on the queue.');
      assert.equal(fourthEvent.trafficTypeName, 'tt2', 'The flushed events should match the events on the queue.');
      assert.equal(fourthEvent.eventTypeId, 'otherEventType', 'The flushed events should match the events on the queue.');
      assert.equal(fourthEvent.value, 3, 'The flushed events should match the events on the queue.');

      return 200;
    });
  });

  await client.ready();

  assert.equal(client.getTreatment('Single_Test'), 'on');
  assert.equal(client2.getTreatment('Single_Test'), 'on');
  assert.equal(client3.getTreatment('Single_Test'), 'on');

  await client.destroy();
  await client2.destroy();
  await client3.destroy();

  assert.equal( client.getTreatment('Single_Test'), 'control' );
  assert.equal( client2.getTreatment('Single_Test'), 'control' );
  assert.equal( client3.getTreatment('Single_Test'), 'control' );

  assert.equal( manager.splits().length , 0 );
  assert.equal( manager.names().length ,  0 );
  assert.equal( manager.split('Single_Test') , null );

  assert.end();
});
