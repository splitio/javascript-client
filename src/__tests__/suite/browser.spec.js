import sinon from 'sinon';
import tape from 'tape-catch';
import fetchMock from '../testUtils/fetchMock';
import { url } from '../testUtils';
import { settingsFactory } from '../../settings';

import splitChangesMock1 from '../mocks/splitChanges.since.-1.till.1500492097547.json';
import splitChangesMock2 from '../mocks/splitChanges.since.1500492097547.json';
import mySegmentsMock from '../mocks/mySegmentsEmpty.json';
import { triggerUnloadEvent } from '../testUtils/browser';
import { version } from '../../../node_modules/@splitsoftware/browser-rum-agent/package.json';

// Test target
import { SplitSuite } from '../../factory/browserSuite';

tape('Split Suite: Browser SDK & RUM Agent', async function (assert) {
  const config = {
    core: {
      authorizationKey: 'fake-key',
      key: 'ut1'
    },
    streamingEnabled: false,
    rumAgent: {
      prefix: 'prefix'
    }
  };

  // Mock fetch requests
  const settings = settingsFactory(config);
  fetchMock.getOnce(url(settings, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.getOnce(url(settings, '/splitChanges?since=1500492097547'), { status: 200, body: splitChangesMock2 });
  fetchMock.getOnce(url(settings, '/mySegments/ut1'), { status: 200, body: mySegmentsMock });
  fetchMock.getOnce(url(settings, '/mySegments/ut2'), { status: 200, body: mySegmentsMock });
  fetchMock.getOnce(url(settings, '/mySegments/ut3'), { status: 200, body: mySegmentsMock });
  fetchMock.postOnce(url(settings, '/v1/metrics/config'), 200); // 0.1% sample rate

  const suite = SplitSuite(config);

  // Assert RUM-Agent is properly configured
  assert.deepEqual(window.SplitRumAgent.__getConfig(), {
    i: [], a: 'fake-key', p: {},
    prefix: settings.rumAgent.prefix,
    url: settings.urls.events,
    pushRate: settings.scheduler.eventsPushRate,
    queueSize: settings.scheduler.eventsQueueSize,
    log: settings.log
  }, 'RUM Agent is properly configured.');
  assert.deepEqual(window.SplitRumAgent.getIdentities(), [], 'No identities are added to the RUM Agent until clients are retrieved.');

  const client = suite.client();
  assert.deepEqual(window.SplitRumAgent.getIdentities(), [{ key: config.core.key, trafficType: 'user' }], 'Identity for the main client.');

  const client2 = suite.client('ut2');
  const client3 = suite.client('ut3', 'tt2');
  assert.deepEqual(window.SplitRumAgent.getIdentities(), [{
    key: config.core.key, trafficType: 'user'
  }, {
    key: 'ut2', trafficType: 'user'
  }, {
    key: 'ut3', trafficType: 'tt2'
  }], 'Identity for the main and shared clients.');

  window.SplitRumAgent.track('custom-event-for-all-clients');

  const manager = suite.manager();

  client.track('tt2', 'eventType', 1);
  client2.track('tt', 'eventType', 2);
  client3.track('otherEventType', 3);

  // Assert we are sending the impressions while doing the destroy
  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), 200);

  // Assert we are sending the impressions count while doing the destroy
  fetchMock.postOnce(url(settings, '/testImpressions/count'), 200);

  // Assert we are sending events tracked by SDK clients, while doing the destroy
  fetchMock.postOnce(url(settings, '/events/bulk'), (url, opts) => {
    const events = JSON.parse(opts.body);

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

    return 200;
  });

  await client.ready();

  assert.equal(client.getTreatment('Single_Test'), 'on');
  assert.equal(client2.getTreatment('Single_Test'), 'on');
  assert.equal(client3.getTreatment('Single_Test'), 'on');
  assert.ok(manager.splits().length > 0, 'control assertion');
  assert.ok(manager.names().length > 0, 'control assertion');
  assert.ok(manager.split('Single_Test'), 'control assertion');

  // Assert that the RUM Agent flush events on unload event
  const sendBeaconSpy = sinon.spy(window.navigator, 'sendBeacon');
  triggerUnloadEvent();

  const eventsCallArgs = sendBeaconSpy.firstCall.args;
  assert.equal(eventsCallArgs[0], url(settings, '/events/beacon'), 'assert correct url');
  const parsedPayload = JSON.parse(eventsCallArgs[1]);
  assert.equal(parsedPayload.token, 'fake-key', 'assert correct payload token');
  assert.equal(parsedPayload.sdk, 'jsrum-' + version, 'assert correct sdk version');
  assert.deepEqual(parsedPayload.entries.map(event => ({ eventTypeId: event.eventTypeId, key: event.key, trafficTypeName: event.trafficTypeName })), [
    { trafficTypeName: 'user', key: 'ut1', eventTypeId: 'prefix.custom-event-for-all-clients' },
    { trafficTypeName: 'user', key: 'ut2', eventTypeId: 'prefix.custom-event-for-all-clients' },
    { trafficTypeName: 'tt2', key: 'ut3', eventTypeId: 'prefix.custom-event-for-all-clients' },
    { trafficTypeName: 'user', key: 'ut1', eventTypeId: 'prefix.time.to.dom.interactive' },
    { trafficTypeName: 'user', key: 'ut2', eventTypeId: 'prefix.time.to.dom.interactive' },
    { trafficTypeName: 'tt2', key: 'ut3', eventTypeId: 'prefix.time.to.dom.interactive' },
    { trafficTypeName: 'user', key: 'ut1', eventTypeId: 'prefix.page.load.time' },
    { trafficTypeName: 'user', key: 'ut2', eventTypeId: 'prefix.page.load.time' },
    { trafficTypeName: 'tt2', key: 'ut3', eventTypeId: 'prefix.page.load.time' },
  ], 'assert correct entries');

  // Events are not sent again
  triggerUnloadEvent();
  assert.ok(sendBeaconSpy.calledOnce, 'sendBeacon should have been called once');

  // Calls `client.destroy()` for all clients
  const destroyPromise = suite.destroy();
  assert.equal(client.getTreatment('Single_Test'), 'control', 'After destroy, getTreatment returns control for every destroyed client.');
  assert.deepEqual(client2.getTreatments(['Single_Test']), { 'Single_Test': 'control' }, 'After destroy, getTreatments returns map of controls for every destroyed client.');
  assert.notOk(client3.track('tt', 'eventType', 2), 'After destroy, track calls return false.');
  assert.equal(manager.splits().length, 0, 'After the main client is destroyed, manager.splits will return empty array');
  assert.equal(manager.names().length, 0, 'After the main client is destroyed, manager.names will return empty array');
  assert.equal(manager.split('Single_Test'), null, 'After the main client is destroyed, manager.split will return null');

  await destroyPromise;
  fetchMock.restore();
  sendBeaconSpy.restore();

  assert.end();
});
