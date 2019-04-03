import tape from 'tape-catch';
import { SplitFactory } from '../../';
import path from 'path';
import SettingsFactory from '../../utils/settings';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import sinon from 'sinon';

// Set the mock adapter on the default instance
const mock = new MockAdapter(axios);

const settings = SettingsFactory({ core: { key: 'facundo@split.io' }});

const spySplitChanges = sinon.spy();
const spySegmentChanges = sinon.spy();
const spyMySegments = sinon.spy();
const spyEventsBulk = sinon.spy();
const spyTestImpressionsBulk = sinon.spy();
const spyMetricsTimes = sinon.spy();
const spyMetricsCounters = sinon.spy();
const spyAny = sinon.spy();

// helper function that should call the spy function and return a 200 to keep
// going the axios request flow
const replySpy = spy => {
  spy();
  return [200];
};

const configMocks = () => {
  mock
    .onAny(new RegExp(`${settings.url('/splitChanges/')}.*`)).reply(() => replySpy(spySplitChanges))
    .onAny(new RegExp(`${settings.url('/segmentChanges/')}.*`)).reply(() => replySpy(spySegmentChanges))
    .onAny(new RegExp(`${settings.url('/mySegments/')}.*`)).reply(() => replySpy(spyMySegments))
    .onAny(settings.url('/events/bulk')).reply(() => replySpy(spyEventsBulk))
    .onAny(settings.url('/testImpressions/bulk')).reply(() => replySpy(spyTestImpressionsBulk))
    .onAny(settings.url('/metrics/times')).reply(() => replySpy(spyMetricsTimes))
    .onAny(settings.url('/metrics/counters')).reply(() => replySpy(spyMetricsCounters))
    .onAny().reply(() => replySpy(spyAny));
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

  client.on(client.Event.SDK_READY, function () {
    assert.equal(client.getTreatment('qa-user', 'testing_split'), 'on');
    assert.equal(client.getTreatment('qa-user', 'testing_split_2'), 'control');
    assert.deepEqual(client.getTreatmentWithConfig('qa-user', 'testing_split'), { treatment: 'on', config: null });
    assert.deepEqual(client.getTreatmentWithConfig('qa-user', 'testing_split_2'), { treatment: 'control', config: null });

    assert.deepEqual(client.getTreatments('qa-user', [
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
    assert.deepEqual(client.getTreatmentsWithConfig('qa-user', [
      'testing_split',
      'testing_split2',
      'testing_split3',
      'testing_not_exist'
    ]), {
      testing_split: { treatment: 'on', config: null },
      testing_split2: { treatment: 'off', config: null },
      testing_split3: { treatment: 'custom_treatment', config: null },
      testing_not_exist: { treatment: 'control', config: null }
    });

    client.destroy().then(() => {
      // We test the breakdown instead of just the misc because it's faster to spot where the issue is
      assert.notOk(spySplitChanges.called, 'On offline mode we should not call the splitChanges endpoint.');
      assert.notOk(spySegmentChanges.called, 'On offline mode we should not call the segmentChanges endpoint.');
      assert.notOk(spyMySegments.called, 'On offline mode we should not call the mySegments endpoint.');
      assert.notOk(spyEventsBulk.called, 'On offline mode we should not call the events endpoint.');
      assert.notOk(spyTestImpressionsBulk.called, 'On offline mode we should not call the impressions endpoint.');
      assert.notOk(spyMetricsTimes.called, 'On offline mode we should not call the metric times endpoint.');
      assert.notOk(spyMetricsCounters.called, 'On offline mode we should not call the metric counters endpoint.');
      assert.notOk(spyAny.called, 'On offline mode we should NOT call to ANY endpoint, we are completely isolated from BE.');

      assert.end();
    });
  });
});
