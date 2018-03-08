import tape from 'tape';
import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import sinon from 'sinon';

const settings = SettingsFactory({ core: { key: 'facundo@split.io' }});

// Set the mock adapter on the default instance
const mock = new MockAdapter(axios);

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

tape('Browser offline mode', function (assert) {
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
    features: {
      testing_split: 'on'
    }
  };
  const factory = SplitFactory(config);
  const client = factory.client();
  const sharedClient = factory.client('nicolas.zelaya@split.io');

  // Tracking some events to test they are not flushed.
  client.track('a_key', 'a_tt', 'an_ev_id');
  client.track('another_key', 'another_tt', 'another_ev_id', 25);
  sharedClient.track('another_key', 'a_tt', 'another_ev_id', 10);

  client.on(client.Event.SDK_READY, function () {
    // Check the information through the client original instance
    assert.equal(client.getTreatment('testing_split'), 'on');
    assert.equal(client.getTreatment('testing_split_2'), 'control');

    assert.deepEqual(client.getTreatments([
      'testing_split',
      'testing_split_2'
    ]), {
      testing_split: 'on',
      testing_split_2: 'control'
    });
    // And then through the shared instance.
    assert.equal(sharedClient.getTreatment('testing_split'), 'on');
    assert.equal(sharedClient.getTreatment('testing_split_2'), 'control');

    assert.deepEqual(sharedClient.getTreatments([
      'testing_split',
      'testing_split_2'
    ]), {
      testing_split: 'on',
      testing_split_2: 'control'
    });

    // Update the features.
    factory.settings.features = {
      testing_split: 'on',
      testing_split_2: 'off',
      testing_split_3: 'custom_treatment'
    };
    // We allow the SDK to process the feature changes and then test again..
    setTimeout(function () {
      assert.equal(client.getTreatment('testing_split_2'), 'off');
      assert.equal(client.getTreatment('testing_split_3'), 'custom_treatment');

      assert.deepEqual(client.getTreatments([
        'testing_split',
        'testing_split_2',
        'testing_split_3',
        'testing_not_exist'
      ]), {
        testing_split: 'on',
        testing_split_2: 'off',
        testing_split_3: 'custom_treatment',
        testing_not_exist: 'control'
      });
      // Test shared client for the same data
      assert.equal(sharedClient.getTreatment('testing_split_2'), 'off');
      assert.equal(sharedClient.getTreatment('testing_split_3'), 'custom_treatment');

      assert.deepEqual(sharedClient.getTreatments([
        'testing_split',
        'testing_split_2',
        'testing_split_3',
        'testing_not_exist'
      ]), {
        testing_split: 'on',
        testing_split_2: 'off',
        testing_split_3: 'custom_treatment',
        testing_not_exist: 'control'
      });

      const sharedClientDestroyPromise = sharedClient.destroy();
      const mainClientDestroyPromise = client.destroy();

      // When both promises have been resolved, we check for network activity
      Promise.all([sharedClientDestroyPromise, mainClientDestroyPromise]).then(() => {
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
    }, 3500);
  });
});
