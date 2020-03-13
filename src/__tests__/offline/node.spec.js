/* eslint-disable no-console */
import path from 'path';
import tape from 'tape-catch';
import sinon from 'sinon';
import MockAdapter from 'axios-mock-adapter';
import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import { __getAxiosInstance } from '../../services/transport';

// Set the mock adapter on the current axios instance
const mock = new MockAdapter(__getAxiosInstance());

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

const settingsGenerator = mockFileName => {
  return {
    core: {
      authorizationKey: 'localhost'
    },
    scheduler: {
      impressionsRefreshRate: 0.01,
      eventsPushRate: 0.01,
      metricsRefreshRate: 0.01,
      offlineRefreshRate: 0.3
    },
    startup: {
      eventsFirstPushWindow: 0,
      readyTimeout: 3,
      retriesOnFailureBeforeReady: 0
    },
    features: path.join(__dirname, mockFileName)
  };
};


tape('NodeJS Offline Mode', function (t) {

  t.test('Old format evaluations - .split', DotSplitTests);
  t.test('New format evaluations - .yaml extension', DotYAMLTests.bind(null, 'split', 'yaml'));
  t.test('New format evaluations - .yml extension', DotYAMLTests.bind(null, 'split2', 'yml'));

  t.test('Old format manager - .split extension', ManagerDotSplitTests);
  t.test('New format manager - .yaml extension', ManagerDotYamlTests.bind(null, 'split.yaml'));
  t.test('New format manager - .yml extension', ManagerDotYamlTests.bind(null, 'split2.yml'));

  t.test('Trying to specify an invalid extension it will timeout', assert => {
    const config = settingsGenerator('.forbidden');

    sinon.spy(console, 'log');

    const factory = SplitFactory({...config, debug: 'ERROR'}); // enable error level logs to check the message.
    const client = factory.client();

    client.on(client.Event.SDK_READY, () => {
      assert.fail('If tried to load a file with invalid extension, we should not get SDK_READY.');

      client.destroy();
      assert.end();
    });
    client.on(client.Event.SDK_READY_TIMED_OUT, () => {
      assert.pass('If tried to load a file with invalid extension, we should emit SDK_READY_TIMED_OUT.');

      assert.ok(console.log.calledWithMatch(`[ERROR] splitio-producer:offline => There was an issue loading the mock Splits data, no changes will be applied to the current cache. Invalid extension specified for Splits mock file. Accepted extensions are ".yml" and ".yaml". Your specified file is ${config.features}`));

      console.log.restore();
      client.destroy();
      assert.end();
    });
  });
});

function networkAssertions(client, assert) {
  return client.destroy().then(() => {
    // We test the breakdown instead of just the misc because it's faster to spot where the issue is
    assert.notOk(spySplitChanges.called, 'On offline mode we should not call the splitChanges endpoint.');
    assert.notOk(spySegmentChanges.called, 'On offline mode we should not call the segmentChanges endpoint.');
    assert.notOk(spyMySegments.called, 'On offline mode we should not call the mySegments endpoint.');
    assert.notOk(spyEventsBulk.called, 'On offline mode we should not call the events endpoint.');
    assert.notOk(spyTestImpressionsBulk.called, 'On offline mode we should not call the impressions endpoint.');
    assert.notOk(spyMetricsTimes.called, 'On offline mode we should not call the metric times endpoint.');
    assert.notOk(spyMetricsCounters.called, 'On offline mode we should not call the metric counters endpoint.');
    assert.notOk(spyAny.called, 'On offline mode we should NOT call to ANY endpoint, we are completely isolated from BE.');
  });
}

function DotSplitTests (assert) {
  configMocks();
  const config = settingsGenerator('.split');
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

    setTimeout(() => { factory.settings.features = path.join(__dirname, '.split'); }, 290);
    setTimeout(() => { factory.settings.features = path.join(__dirname, '.split'); }, 590);
    setTimeout(() => { factory.settings.features = path.join(__dirname, '.split'); }, 890);
    setTimeout(() => { factory.settings.features = path.join(__dirname, 'update.split'); }, 1000);

    client.once(client.Event.SDK_UPDATE, () => {
      assert.equal(client.getTreatment('qa-user', 'testing_split4'), 'updated_treatment');

      networkAssertions(client, assert).then(() => {
        client.destroy().then(assert.end);
      });
    });
  });
}

function DotYAMLTests (mockFileName, mockFileExt, assert) {
  configMocks();
  const config = settingsGenerator(`${mockFileName}.${mockFileExt}`);
  const factory = SplitFactory(config);
  const client = factory.client();
  // Tracking some events to test they are not flushed.
  assert.true(client.track('a_key', 'a_tt', 'an_ev_id'));
  assert.true(client.track('another_key', 'another_tt', 'another_ev_id', 25));
  assert.false(client.track('wasa', {}, [], 'invalid_stuff'));

  client.on(client.Event.SDK_READY, function () {
    assert.equal(client.getTreatment('qa-user', 'testing_split_on'), 'on');
    assert.equal(client.getTreatment('qa-user', 'testing_split_only_wl'), 'control');
    assert.equal(client.getTreatment('key_for_wl', 'testing_split_only_wl'), 'whitelisted');
    assert.equal(client.getTreatment('qa-user', 'testing_split_with_wl'), 'not_in_whitelist');
    assert.equal(client.getTreatment('key_for_wl', 'testing_split_with_wl'), 'one_key_wl');
    assert.equal(client.getTreatment('key_for_wl_1', 'testing_split_with_wl'), 'multi_key_wl');
    assert.equal(client.getTreatment('key_for_wl_2', 'testing_split_with_wl'), 'multi_key_wl');
    assert.equal(client.getTreatment('qa-user', 'testing_split_off_with_config'), 'off');
    assert.equal(client.getTreatment('qa-user', 'not_existent'), 'control');

    assert.deepEqual(client.getTreatmentWithConfig('qa-user', 'testing_split_on'), { treatment: 'on', config: null });
    assert.deepEqual(client.getTreatmentWithConfig('qa-user', 'testing_split_only_wl'), { treatment: 'control', config: null });
    assert.deepEqual(client.getTreatmentWithConfig('key_for_wl', 'testing_split_only_wl'), { treatment: 'whitelisted', config: null });
    assert.deepEqual(client.getTreatmentWithConfig('qa-user', 'testing_split_with_wl'), { treatment: 'not_in_whitelist', config: '{"color": "green"}' });
    assert.deepEqual(client.getTreatmentWithConfig('key_for_wl', 'testing_split_with_wl'), { treatment: 'one_key_wl', config: null });
    assert.deepEqual(client.getTreatmentWithConfig('key_for_wl_1', 'testing_split_with_wl'), { treatment: 'multi_key_wl', config: '{"color": "brown"}' });
    assert.deepEqual(client.getTreatmentWithConfig('key_for_wl_2', 'testing_split_with_wl'), { treatment: 'multi_key_wl', config: '{"color": "brown"}' });
    assert.deepEqual(client.getTreatmentWithConfig('qa-user', 'testing_split_off_with_config'), { treatment: 'off', config: '{"color": "green"}' });
    assert.deepEqual(client.getTreatmentWithConfig('qa-user', 'not_existent'), { treatment: 'control', config: null });

    assert.deepEqual(client.getTreatments('qa-user', [
      'testing_split_on',
      'testing_split_only_wl',
      'testing_split_with_wl',
      'testing_split_off_with_config',
      'testing_not_exist'
    ]), {
      testing_split_on: 'on',
      testing_split_only_wl: 'control',
      testing_split_with_wl: 'not_in_whitelist',
      testing_split_off_with_config: 'off',
      testing_not_exist: 'control'
    });
    assert.deepEqual(client.getTreatmentsWithConfig('key_for_wl', [
      'testing_split_on',
      'testing_split_only_wl',
      'testing_split_with_wl',
      'testing_split_off_with_config',
      'testing_not_exist'
    ]), {
      testing_split_on: { treatment: 'on', config: null },
      testing_split_only_wl: { treatment: 'whitelisted', config: null },
      testing_split_with_wl: { treatment: 'one_key_wl', config: null },
      testing_split_off_with_config: { treatment: 'off', config: '{"color": "green"}' },
      testing_not_exist: { treatment: 'control', config: null }
    });

    let readyTimestamp = Date.now();

    setTimeout(() => { factory.settings.features = path.join(__dirname, `${mockFileName}.${mockFileExt}` ); }, 290);
    setTimeout(() => { factory.settings.features = path.join(__dirname, `${mockFileName}.${mockFileExt}` ); }, 590);
    setTimeout(() => { factory.settings.features = path.join(__dirname, `${mockFileName}.${mockFileExt}` ); }, 890);
    setTimeout(() => { factory.settings.features = path.join(__dirname, `update.${mockFileName}.${mockFileExt}`); }, 1000);

    client.once(client.Event.SDK_UPDATE, () => {
      assert.equal(client.getTreatment('qa-user', 'testing_split_update'), 'updated_treatment', 'the update should be properly processed');
      assert.true((Date.now() - readyTimestamp) > 1000);

      networkAssertions(client, assert).then(() => {
        client.destroy().then(assert.end);
      });
    });
  });
}

function ManagerDotSplitTests(assert) {
  configMocks();
  const config = settingsGenerator('.split');
  const factory = SplitFactory(config);
  const client = factory.client();
  const manager = factory.manager();

  manager.on(manager.Event.SDK_READY, function () {
    assert.deepEqual(manager.names(), ['testing_split', 'testing_split2', 'testing_split3']);

    const expectedView1 = {
      name: 'testing_split', changeNumber: 0, killed: false, trafficType: null,
      treatments: ['on'], configs: {}
    };
    const expectedView2 = {
      name: 'testing_split2', changeNumber: 0, killed: false, trafficType: null,
      treatments: ['off'], configs: {}
    };
    const expectedView3 = {
      name: 'testing_split3', changeNumber: 0, killed: false, trafficType: null,
      treatments: ['custom_treatment'], configs: {}
    };

    assert.deepEqual(manager.split('testing_split'), expectedView1);
    assert.deepEqual(manager.split('testing_split2'), expectedView2);
    assert.deepEqual(manager.split('testing_split3'), expectedView3);
    assert.equal(manager.split('split_not_existent'), null);

    assert.deepEqual(manager.splits(), [expectedView1, expectedView2, expectedView3]);

    networkAssertions(client, assert).then(() => {
      client.destroy().then(assert.end);
    });
  });
}

function ManagerDotYamlTests(mockFileName, assert) {
  configMocks();
  const config = settingsGenerator(mockFileName);
  const factory = SplitFactory(config);
  const client = factory.client();
  const manager = factory.manager();

  manager.on(manager.Event.SDK_READY, function () {
    assert.deepEqual(manager.names(), ['testing_split_on', 'testing_split_only_wl', 'testing_split_with_wl', 'testing_split_off_with_config']);

    const expectedView1 = {
      name: 'testing_split_on',
      changeNumber: 0,
      killed: false,
      trafficType: 'localhost',
      treatments: ['on'],
      configs: {}
    };
    const expectedView2 = {
      name: 'testing_split_only_wl',
      changeNumber: 0,
      killed: false,
      trafficType: 'localhost',
      treatments: ['whitelisted'],
      configs: {}
    };
    const expectedView3 = {
      name: 'testing_split_with_wl',
      changeNumber: 0,
      killed: false,
      trafficType: 'localhost',
      treatments: ['not_in_whitelist', 'one_key_wl', 'multi_key_wl'],
      configs: {
        not_in_whitelist: '{"color": "green"}',
        multi_key_wl: '{"color": "brown"}'
      }
    };
    const expectedView4 = {
      name: 'testing_split_off_with_config', changeNumber: 0, killed: false, trafficType: 'localhost',
      treatments: ['off'], configs: {
        off: '{"color": "green"}'
      }
    };

    assert.deepEqual(manager.split('testing_split_on'), expectedView1);
    assert.deepEqual(manager.split('testing_split_only_wl'), expectedView2);
    assert.deepEqual(manager.split('testing_split_with_wl'), expectedView3);
    assert.deepEqual(manager.split('testing_split_off_with_config'), expectedView4);
    assert.equal(manager.split('not_existent'), null);

    assert.deepEqual(manager.splits(), [expectedView1, expectedView2, expectedView3, expectedView4]);

    networkAssertions(client, assert).then(() => {
      client.destroy().then(assert.end);
    });
  });
}
