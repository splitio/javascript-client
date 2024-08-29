import tape from 'tape-catch';
import sinon from 'sinon';
import fetchMock from '../testUtils/fetchMock';
import { url } from '../testUtils';
import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const settings = settingsFactory({ core: { key: 'facundo@split.io' } });

const spySplitChanges = sinon.spy();
const spySegmentChanges = sinon.spy();
const spyMemberships = sinon.spy();
const spyEventsBulk = sinon.spy();
const spyTestImpressionsBulk = sinon.spy();
const spyTestImpressionsCount = sinon.spy();
const spyMetricsTimes = sinon.spy();
const spyMetricsCounters = sinon.spy();
const spyAny = sinon.spy();

// helper function that should call the spy function and return a 200 to keep
// going the fetch request flow
const replySpy = spy => {
  spy();
  return 200;
};

const configMocks = () => {
  fetchMock.mock(new RegExp(`${url(settings, '/splitChanges/')}.*`), () => replySpy(spySplitChanges));
  fetchMock.mock(new RegExp(`${url(settings, '/segmentChanges/')}.*`), () => replySpy(spySegmentChanges));
  fetchMock.mock(new RegExp(`${url(settings, '/memberships/')}.*`), () => replySpy(spyMemberships));
  fetchMock.mock(url(settings, '/events/bulk'), () => replySpy(spyEventsBulk));
  fetchMock.mock(url(settings, '/testImpressions/bulk'), () => replySpy(spyTestImpressionsBulk));
  fetchMock.mock(url(settings, '/testImpressions/count'), () => replySpy(spyTestImpressionsCount));
  fetchMock.mock('*', () => replySpy(spyAny));
};

tape('Browser offline mode', function (assert) {
  configMocks();
  const originalFeaturesMap = {
    testing_split: 'on',
    testing_split_with_config: {
      treatment: 'off',
      config: '{ "color": "blue" }',
      sets: []
    }
  };

  const config = {
    core: {
      // Although `key` is mandatory according to TypeScript declaration files,
      // it can be omitted in LOCALHOST mode. In that case, the value `localhost_key` is used.
      authorizationKey: 'localhost'
    },
    scheduler: {
      impressionsRefreshRate: 0.01,
      eventsPushRate: 0.01,
      offlineRefreshRate: 0.19
    },
    startup: {
      eventsFirstPushWindow: 0
    },
    features: originalFeaturesMap
  };
  const factory = SplitFactory(config);
  const manager = factory.manager();
  const client = factory.client();
  const sharedClient = factory.client('nicolas.zelaya@split.io');

  // Tracking some events to test they are not flushed.
  assert.true(client.track('a_tt', 'an_ev_id'));
  assert.true(client.track('another_tt', 'another_ev_id', 25));
  assert.false(client.track({}, [], 'invalid_stuff'));
  assert.true(sharedClient.track('a_tt', 'another_ev_id', 10));

  assert.equal(client.getTreatment('testing_split'), 'control', 'control due to not ready');
  assert.equal(sharedClient.getTreatment('testing_split'), 'control', 'control due to not ready');
  assert.equal(manager.splits().length, 0);

  // SDK events on shared client
  let sharedReadyCount = 0;
  sharedClient.on(sharedClient.Event.SDK_READY, function () {
    assert.equal(sharedClient.getTreatment('testing_split'), 'on');
    sharedReadyCount++;
  });
  let sharedUpdateCount = 0;
  sharedClient.on(sharedClient.Event.SDK_UPDATE, function () {
    sharedUpdateCount++;
  });

  const configs = [
    { ...config, features: { ...config.features }, storage: { type: 'INVALID TYPE' } },
    { ...config, storage: { type: 'LOCALSTORAGE' } },
    { ...config },
    config,
  ];
  const factories = configs.map(config => SplitFactory(config));

  let readyCount = 0, updateCount = 0, readyFromCacheCount = 0;

  for (let i = 0; i < factories.length; i++) {
    const factory = factories[i], client = factory.client(), manager = factory.manager(), client2 = factory.client('other');

    client.on(client.Event.SDK_READY, () => {
      assert.deepEqual(manager.names(), ['testing_split', 'testing_split_with_config']);
      assert.equal(client.getTreatment('testing_split_with_config'), 'off');
      readyCount++;
    });
    client.on(client.Event.SDK_UPDATE, () => {
      assert.deepEqual(manager.names().sort(), ['testing_split', 'testing_split_2', 'testing_split_3', 'testing_split_with_config']);
      assert.equal(client.getTreatment('testing_split_with_config'), 'nope');
      updateCount++;
    });

    const sdkReadyFromCache = (client) => () => {
      assert.equal(factory.settings.storage.type, 'MEMORY', 'In localhost mode, storage must fallback to memory storage');

      const clientStatus = client.__getStatus();
      assert.equal(clientStatus.isReadyFromCache, true, 'If ready from cache, READY_FROM_CACHE status must be true');
      assert.equal(clientStatus.isReady, false, 'READY status must not be set before READY_FROM_CACHE');

      assert.deepEqual(manager.names(), ['testing_split', 'testing_split_with_config']);
      assert.equal(client.getTreatment('testing_split_with_config'), 'off');
      readyFromCacheCount++;

      client.on(client.Event.SDK_READY_FROM_CACHE, () => {
        assert.fail('It should not emit SDK_READY_FROM_CACHE again');
      });

      const newClient = factory.client('another');
      assert.equal(newClient.getTreatment('testing_split_with_config'), 'off', 'It should evaluate treatments with data from cache instead of control');
      newClient.on(newClient.Event.SDK_READY_FROM_CACHE, () => {
        assert.fail('It should not emit SDK_READY_FROM_CACHE if already done.');
      });
    };

    client.on(client.Event.SDK_READY_FROM_CACHE, sdkReadyFromCache(client));
    client2.on(client2.Event.SDK_READY_FROM_CACHE, sdkReadyFromCache(client2));
  }

  client.once(client.Event.SDK_READY, function () {
    const readyTimestamp = Date.now();

    // Check the information through the client original instance
    assert.equal(client.getTreatment('testing_split'), 'on');
    assert.equal(client.getTreatment('testing_split_2'), 'control');
    assert.equal(client.getTreatment('testing_split_with_config'), 'off');
    assert.deepEqual(client.getTreatments([
      'testing_split',
      'testing_split_2',
      'testing_split_with_config'
    ]), {
      testing_split: 'on',
      testing_split_2: 'control',
      testing_split_with_config: 'off'
    });
    // with config
    assert.deepEqual(client.getTreatmentWithConfig('testing_split'), { treatment: 'on', config: null });
    assert.deepEqual(client.getTreatmentWithConfig('testing_split_with_config'), { treatment: 'off', config: '{ "color": "blue" }' });
    assert.deepEqual(client.getTreatmentsWithConfig([
      'testing_split',
      'testing_split_2',
      'testing_split_with_config'
    ]), {
      testing_split: { treatment: 'on', config: null },
      testing_split_2: { treatment: 'control', config: null },
      testing_split_with_config: { treatment: 'off', config: '{ "color": "blue" }' }
    });

    // Manager tests
    const expectedSplitView1 = {
      name: 'testing_split', trafficType: 'localhost', killed: false, changeNumber: 0, treatments: ['on'], configs: {}, defaultTreatment: 'control', sets: []
    };
    const expectedSplitView2 = {
      name: 'testing_split_with_config', trafficType: 'localhost', killed: false, changeNumber: 0, treatments: ['off'], configs: { off: '{ "color": "blue" }' }, defaultTreatment: 'control', sets: []
    };
    assert.deepEqual(manager.names(), ['testing_split', 'testing_split_with_config']);
    assert.deepEqual(manager.split('testing_split'), expectedSplitView1);
    assert.deepEqual(manager.split('testing_split_with_config'), expectedSplitView2);
    assert.deepEqual(manager.split('not_existent'), null);
    assert.deepEqual(manager.splits(), [expectedSplitView1, expectedSplitView2]);

    const otherSharedClient = factory.client('emiliano.sanchez@split.io');
    assert.equal(otherSharedClient.getTreatment('testing_split'), 'control');
    otherSharedClient.on(otherSharedClient.Event.SDK_READY, function () {
      assert.equal(otherSharedClient.getTreatment('testing_split'), 'on');
    });
    // And then through the shared instance.
    // We use ready promise since SDK_READY may have been emitted for the shared client (not in this case anyway)
    otherSharedClient.ready().then(() => {
      assert.equal(otherSharedClient.getTreatment('testing_split'), 'on');
      assert.equal(otherSharedClient.getTreatment('testing_split_2'), 'control');
      assert.deepEqual(otherSharedClient.getTreatments([
        'testing_split',
        'testing_split_2',
        'testing_split_with_config'
      ]), {
        testing_split: 'on',
        testing_split_2: 'control',
        testing_split_with_config: 'off'
      });
      // with config
      assert.deepEqual(otherSharedClient.getTreatmentWithConfig('testing_split'), { treatment: 'on', config: null });
      assert.deepEqual(otherSharedClient.getTreatmentsWithConfig([
        'testing_split',
        'testing_split_2',
        'testing_split_with_config'
      ]), {
        testing_split: { treatment: 'on', config: null },
        testing_split_2: { treatment: 'control', config: null },
        testing_split_with_config: { treatment: 'off', config: '{ "color": "blue" }' }
      });
    });

    setTimeout(() => {
      // Update features reference in settings
      factory.settings.features = {
        testing_split: 'on',
        testing_split_2: 'off',
        testing_split_3: 'custom_treatment',
        testing_split_with_config: {
          treatment: 'nope',
          config: null
        }
      };

      // Update features properties in config
      configs[0].features['testing_split'] = 'on';
      configs[0].features['testing_split_2'] = 'off';
      configs[0].features['testing_split_3'] = 'custom_treatment';
      configs[0].features['testing_split_with_config'] = {
        treatment: 'nope',
        config: null
      };

      // Update the features in all remaining factories except the last one
      for (let i = 1; i < factories.length - 1; i++) {
        factories[i].settings.features = factory.settings.features;
      }

      // Assigning a new object to the features property in the config doesn't trigger an update
      configs[configs.length - 1].features = { ...factory.settings.features };
    }, 1000);

    setTimeout(() => { factory.settings.features = originalFeaturesMap; }, 200);
    setTimeout(() => { factory.settings.features = { testing_split: 'on', testing_split_with_config: { treatment: 'off', config: '{ "color": "blue" }' } }; }, 400);
    setTimeout(() => { factory.settings.features = originalFeaturesMap; }, 600);
    setTimeout(() => { factory.settings.features = { testing_split: 'on', testing_split_with_config: { treatment: 'off', config: '{ "color": "blue" }' } }; }, 750);

    // once updated, test again.
    client.once(client.Event.SDK_UPDATE, function () {
      assert.true((Date.now() - readyTimestamp) > 1000, 'Should only emit SDK_UPDATE after a real update.');

      client.once(client.Event.SDK_UPDATE, function () { assert.fail('Should not emit a second SDK_UPDATE event'); });

      assert.equal(client.getTreatment('testing_split_2'), 'off');
      assert.equal(client.getTreatment('testing_split_3'), 'custom_treatment');
      assert.deepEqual(client.getTreatmentWithConfig('testing_split_3'), { treatment: 'custom_treatment', config: null });
      assert.deepEqual(client.getTreatmentWithConfig('testing_split_with_config'), { treatment: 'nope', config: null });

      assert.deepEqual(client.getTreatments([
        'testing_split',
        'testing_split_2',
        'testing_split_3',
        'testing_split_with_config',
        'testing_not_exist'
      ]), {
        testing_split: 'on',
        testing_split_2: 'off',
        testing_split_3: 'custom_treatment',
        testing_split_with_config: 'nope',
        testing_not_exist: 'control'
      });
      assert.deepEqual(client.getTreatmentsWithConfig([
        'testing_split_2',
        'testing_split_3',
        'testing_split_with_config'
      ]), {
        testing_split_2: { treatment: 'off', config: null },
        testing_split_3: { treatment: 'custom_treatment', config: null },
        testing_split_with_config: { treatment: 'nope', config: null }
      });

      // Manager tests
      const expectedSplitView3 = {
        name: 'testing_split_with_config', trafficType: 'localhost', killed: false, changeNumber: 0, treatments: ['nope'], configs: {}, defaultTreatment: 'control', sets: []
      };
      assert.deepEqual(manager.names(), ['testing_split', 'testing_split_2', 'testing_split_3', 'testing_split_with_config']);
      assert.deepEqual(manager.split('testing_split'), expectedSplitView1);
      assert.deepEqual(manager.split('not_existent'), null);
      assert.deepEqual(manager.split('testing_split_with_config'), expectedSplitView3);
      assert.deepEqual(manager.splits(), [
        expectedSplitView1,
        {
          ...expectedSplitView3, name: 'testing_split_2', treatments: ['off']
        },
        {
          ...expectedSplitView3, name: 'testing_split_3', treatments: ['custom_treatment']
        },
        expectedSplitView3
      ]);

      // Test shared client for the same data
      assert.equal(sharedClient.getTreatment('testing_split_2'), 'off');
      assert.equal(sharedClient.getTreatment('testing_split_3'), 'custom_treatment');
      assert.deepEqual(sharedClient.getTreatmentWithConfig('testing_split_3'), { treatment: 'custom_treatment', config: null });
      assert.deepEqual(sharedClient.getTreatmentWithConfig('testing_split_with_config'), { treatment: 'nope', config: null });

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
      assert.deepEqual(sharedClient.getTreatmentsWithConfig([
        'testing_split_3',
        'testing_not_exist'
      ]), {
        testing_split_3: { treatment: 'custom_treatment', config: null },
        testing_not_exist: { treatment: 'control', config: null }
      });

      // timeout to wait SDK_UPDATE on all factories
      setTimeout(() => {
        const destroyPromises = [
          sharedClient.destroy(), client.destroy(),
          ...factories.map(f => f.client().destroy())
        ];

        // When both promises have been resolved, we check for network activity
        Promise.all(destroyPromises).then(() => {
          // We test the breakdown instead of just the misc because it's faster to spot where the issue is
          assert.notOk(spySplitChanges.called, 'On offline mode we should not call the splitChanges endpoint.');
          assert.notOk(spySegmentChanges.called, 'On offline mode we should not call the segmentChanges endpoint.');
          assert.notOk(spyMemberships.called, 'On offline mode we should not call the Memberships endpoint.');
          assert.notOk(spyEventsBulk.called, 'On offline mode we should not call the events endpoint.');
          assert.notOk(spyTestImpressionsBulk.called, 'On offline mode we should not call the impressions endpoint.');
          assert.notOk(spyTestImpressionsCount.called, 'On offline mode we should not call the impressions count endpoint.');
          assert.notOk(spyMetricsTimes.called, 'On offline mode we should not call the metric times endpoint.');
          assert.notOk(spyMetricsCounters.called, 'On offline mode we should not call the metric counters endpoint.');
          assert.notOk(spyAny.called, 'On offline mode we should NOT call to ANY endpoint, we are completely isolated from BE.');

          // SDK events on shared client
          assert.equal(sharedReadyCount, 1, 'Shared client should have emitted SDK_READY event once');
          assert.equal(sharedUpdateCount, 1, 'Shared client should have emitted SDK_UPDATE event once');

          // SDK events on other factory clients
          assert.equal(readyCount, factories.length, 'Each factory client should have emitted SDK_READY event once');
          assert.equal(updateCount, factories.length - 1, 'Each factory client except one should have emitted SDK_UPDATE event once');
          assert.equal(readyFromCacheCount, 2, 'The main and shared client of the factory with LOCALSTORAGE should have emitted SDK_READY_FROM_CACHE event');

          assert.end();
        });
      });
    }, 3500);
  });
});
