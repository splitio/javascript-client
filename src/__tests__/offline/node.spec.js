// @flow

'use strict';

const tape = require('tape-catch');
const SplitFactory = require('../../');
const fetchMock = require('fetch-mock');
const path = require('path');
const SettingsFactory = require('../../utils/settings');
const settings = SettingsFactory({ core: { key: 'facundo@split.io' }});

const delayResponse = () => new Promise(res => setTimeout(res, 0)).then(() => 'mock');

const configMocks = () => {
  fetchMock
    .mock(settings.url('/splitChanges/*'), () => delayResponse(), { name: 'splitChanges' })
    .mock(settings.url('/segmentChanges/*'), () => delayResponse(), { name: 'segmentChanges' })
    .mock(settings.url('/mySegments/*'), () => delayResponse(), { name: 'mySegments' })
    .mock(settings.url('/events/bulk'), () => delayResponse(), { name: 'events' })
    .mock(settings.url('/testImpressions/bulk'), () => delayResponse(), { name: 'impressions' })
    .mock(settings.url('/metrics/times'), () => delayResponse(), { name: 'metricTimes' })
    .mock(settings.url('/metrics/counters'), () => delayResponse(), { name: 'metricCounters' })
    .mock('*', () => delayResponse(), { name: 'miscelaneous' });
};

tape('NodeJS Offline mode', function (assert) {
  configMocks();
  const config = {
    core: {
      authorizationKey: 'localhost'
    },
    scheduler: {
      impressionsRefreshRate: 0.01,
      eventsPushRate: 0.01,
      metricsRefreshRate: 0.01,
      offlineRefreshRate: 3
    },
    startup: {
      eventsFirstPushWindow: 0
    },
    features: path.join(__dirname, '.split')
  };
  const factory = SplitFactory(config);
  const client = factory.client();
  // Tracking some events to test they are not flushed.
  client.track('a_key', 'a_tt', 'an_ev_id');
  client.track('another_key', 'another_tt', 'another_ev_id', 25);

  client.on(client.Event.SDK_READY, async function () {
    assert.equal(await client.getTreatment('qa-user', 'testing_split'), 'on');
    assert.equal(await client.getTreatment('qa-user', 'testing_split_2'), 'control');

    assert.deepEqual(await client.getTreatments('qa-user', [
      'testing_split',
      'testing_split2',
      'testing_split3',
      'testing_not_exist'
    ]), {
      testing_split: 'on',
      testing_split2: 'off',
      testing_split3: 'custom_treatment',
      testing_not_exist: 'control'
    });

    client.destroy().then(() => {
      // We test the breakdown instead of just the misc because it's faster to spot where the issue is
      assert.notOk(fetchMock.called('splitChanges'), 'On offline mode we should not call the splitChanges endpoint.');
      assert.notOk(fetchMock.called('segmentChanges'), 'On offline mode we should not call the segmentChanges endpoint.');
      assert.notOk(fetchMock.called('mySegments'), 'On offline mode we should not call the mySegments endpoint.');
      assert.notOk(fetchMock.called('events'), 'On offline mode we should not call the events endpoint.');
      assert.notOk(fetchMock.called('impressions'), 'On offline mode we should not call the impressions endpoint.');
      assert.notOk(fetchMock.called('metric times'), 'On offline mode we should not call the metric times endpoint.');
      assert.notOk(fetchMock.called('metric counters'), 'On offline mode we should not call the metric counters endpoint.');
      assert.notOk(fetchMock.called('miscelaneous'), 'On offline mode we should NOT call to ANY endpoint, we are completely isolated from BE.');

      assert.end();
    });
  });
});
