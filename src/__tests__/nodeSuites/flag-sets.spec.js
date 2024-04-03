import { SplitFactory } from '../..';
import { mockSegmentChanges } from '../testUtils';


import splitChange2 from '../mocks/splitchanges.since.-1.till.1602796638344.json';
import splitChange1 from '../mocks/splitchanges.since.1602796638344.till.1602797638344.json';
import splitChange0 from '../mocks/splitchanges.since.1602797638344.till.1602798638344.json';

const baseUrls = { sdk: 'https://sdk.baseurl' };

const baseConfig = {
  core: {
    authorizationKey: '<fake-token>',
  },
  urls: baseUrls,
  scheduler: { featuresRefreshRate: 0.01 },
  streamingEnabled: false,
};

const key = 'emma';

export default function flagSets(fetchMock, t) {
  mockSegmentChanges(fetchMock, new RegExp(baseUrls.sdk + '/segmentChanges/*'), ['some_key']);

  t.test(async (assert) => {
    let factory, manager, client = [];

    // Receive split change with 1 split belonging to set_1 & set_2 and one belonging to set_3
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=-1&sets=set_1,set_2',  function () {
      return { status: 200, body: splitChange2};
    });

    // Receive split change with 1 split belonging to set_1 only
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=1602796638344&sets=set_1,set_2',  function () {
      // stored feature flags before update
      const storedFlags = manager.splits();
      assert.true(storedFlags.length === 1, 'only one feature flag should be added');
      assert.true(storedFlags[0].name === 'workm');
      assert.deepEqual(storedFlags[0].sets, ['set_1','set_2']);

      // send split change
      return { status: 200, body: splitChange1};
    });

    // Receive split change with 1 split belonging to set_3 only
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=1602797638344&sets=set_1,set_2',  function () {
      // stored feature flags before update
      const storedFlags = manager.splits();
      assert.true(storedFlags.length === 1);
      assert.true(storedFlags[0].name === 'workm');
      assert.deepEqual(storedFlags[0].sets, ['set_1'], 'the feature flag should be updated');

      // send split change
      return { status: 200, body: splitChange0};
    });

    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=1602798638344&sets=set_1,set_2',  async function () {
      // stored feature flags before update
      const storedFlags = manager.splits();
      assert.true(storedFlags.length === 0, 'the feature flag should be removed');
      await client.destroy();
      client = [];
      assert.end();

      return { status: 200, body: {} };
    });

    // Initialize a factory with polling and sets set_1 & set_2 configured.
    const splitFilters = [{ type: 'bySet', values: ['set_1','set_2'] }];
    factory = SplitFactory({ ...baseConfig, sync: { splitFilters }});
    client = factory.client();
    await client.ready();
    manager = factory.manager();

  }, 'Polling - SDK with sets configured updates flags according to sets');

  t.test(async (assert) => {

    let factory, manager, client = [];

    // Receive split change with 1 split belonging to set_1 & set_2 and one belonging to set_3
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=-1',  function () {
      return { status: 200, body: splitChange2};
    });

    // Receive split change with 1 split belonging to set_1 only
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=1602796638344',  function () {
      // stored feature flags before update
      const storedFlags = manager.splits();
      assert.true(storedFlags.length === 2, 'every feature flag should be added');
      assert.true(storedFlags[0].name === 'workm');
      assert.true(storedFlags[1].name === 'workm_set_3');
      assert.deepEqual(storedFlags[0].sets, ['set_1','set_2']);
      assert.deepEqual(storedFlags[1].sets, ['set_3']);

      // send split change
      return { status: 200, body: splitChange1};
    });

    // Receive split change with 1 split belonging to set_3 only
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=1602797638344',  function () {
      // stored feature flags before update
      const storedFlags = manager.splits();
      assert.true(storedFlags.length === 2);
      assert.true(storedFlags[0].name === 'workm');
      assert.true(storedFlags[1].name === 'workm_set_3');
      assert.deepEqual(storedFlags[0].sets, ['set_1'], 'the feature flag should be updated');
      assert.deepEqual(storedFlags[1].sets, ['set_3'], 'the feature flag should remain as it was');

      // send split change
      return { status: 200, body: splitChange0};
    });

    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=1602798638344',  async function () {
      // stored feature flags before update
      const storedFlags = manager.splits();
      assert.true(storedFlags.length === 2);
      assert.true(storedFlags[0].name === 'workm');
      assert.true(storedFlags[1].name === 'workm_set_3');
      assert.deepEqual(storedFlags[0].sets, ['set_3'], 'the feature flag should be updated');
      assert.deepEqual(storedFlags[1].sets, ['set_3'], 'the feature flag should remain as it was');
      await client.destroy();
      assert.end();
      return { status: 200, body: {} };
    });

    // Initialize a factory with polling and no sets configured.
    factory = SplitFactory(baseConfig);
    client = factory.client();
    await client.ready();
    manager = factory.manager();

  }, 'Poling - SDK with no sets configured does not take sets into account when updating flags');

  // EVALUATION

  t.test(async (assert) => {
    fetchMock.reset();

    let factory, client = [];

    mockSegmentChanges(fetchMock, new RegExp(baseUrls.sdk + '/segmentChanges/*'), []);
    fetchMock.post('*', 200);
    // Receive split change with 1 split belonging to set_1 & set_2 and one belonging to set_3
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=-1&sets=set_1',  function () {
      return { status: 200, body: splitChange2};
    });

    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=1602796638344&sets=set_1', async function () {
      // stored feature flags before update
      assert.deepEqual(client.getTreatmentsByFlagSet(key, 'set_1'), {workm: 'on'}, 'only the flag in set_1 can be evaluated');
      assert.deepEqual(client.getTreatmentsByFlagSet(key, 'set_2'), {}, 'only the flag in set_1 can be evaluated');
      assert.deepEqual(client.getTreatmentsByFlagSet(key, 'set_3'), {}, 'only the flag in set_1 can be evaluated');
      assert.deepEqual(client.getTreatmentsWithConfigByFlagSet(key, 'set_1'), { workm: { treatment: 'on', config: null } }, 'only the flag in set_1 can be evaluated');
      assert.deepEqual(client.getTreatmentsWithConfigByFlagSet(key, 'set_2'), {}, 'only the flag in set_1 can be evaluated');
      assert.deepEqual(client.getTreatmentsWithConfigByFlagSet(key, 'set_3'), {}, 'only the flag in set_1 can be evaluated');
      assert.deepEqual(client.getTreatmentsByFlagSets(key, ['set_1','set_2','set_3']), {workm: 'on'}, 'only the flag in set_1 can be evaluated');
      assert.deepEqual(client.getTreatmentsWithConfigByFlagSets(key, ['set_1','set_2','set_3']), { workm: { treatment: 'on', config: null } }, 'only the flag in set_1 can be evaluated');
      await client.destroy();
      assert.end();

      // send split change
      return { status: 200, body: splitChange1};
    });

    // Initialize a factory with set_1 configured.
    const splitFilters = [{ type: 'bySet', values: ['set_1'] }];
    factory = SplitFactory({ ...baseConfig, sync: { splitFilters }});
    client = factory.client();
    await client.ready();

  }, 'SDK with sets configured can only evaluate configured sets');

  t.test(async (assert) => {
    fetchMock.reset();

    let factory, client = [];

    mockSegmentChanges(fetchMock, new RegExp(baseUrls.sdk + '/segmentChanges/*'), []);
    fetchMock.post('*', 200);

    // Receive split change with 1 split belonging to set_1 & set_2 and one belonging to set_3
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=-1',  function () {
      return { status: 200, body: splitChange2};
    });

    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?v=1.0&since=1602796638344',  async function () {
      // stored feature flags before update
      assert.deepEqual(client.getTreatmentsByFlagSet(key, 'set_1'), {workm: 'on'}, 'all flags can be evaluated');
      assert.deepEqual(client.getTreatmentsByFlagSet(key, 'set_2'), {workm: 'on'}, 'all flags can be evaluated');
      assert.deepEqual(client.getTreatmentsByFlagSet(key, 'set_3'), { workm_set_3: 'on' }, 'all flags can be evaluated');
      assert.deepEqual(client.getTreatmentsWithConfigByFlagSet(key, 'set_1'), { workm: { treatment: 'on', config: null } }, 'all flags can be evaluated');
      assert.deepEqual(client.getTreatmentsWithConfigByFlagSet(key, 'set_2'), { workm: { treatment: 'on', config: null } }, 'all flags can be evaluated');
      assert.deepEqual(client.getTreatmentsWithConfigByFlagSet(key, 'set_3'), { workm_set_3: { treatment: 'on', config: null } }, 'all flags can be evaluated');
      assert.deepEqual(client.getTreatmentsByFlagSets(key, ['set_1','set_2','set_3']), { workm: 'on', workm_set_3: 'on' }, 'all flags can be evaluated');
      assert.deepEqual(client.getTreatmentsWithConfigByFlagSets(key, ['set_1','set_2','set_3']), { workm: { treatment: 'on', config: null }, workm_set_3: { treatment: 'on', config: null } }, 'all flags can be evaluated');
      await client.destroy();
      assert.end();

      // send split change
      return { status: 200, body: splitChange1};
    });


    factory = SplitFactory(baseConfig);
    client = factory.client();
    await client.ready();

  }, 'SDK with no sets configured can evaluate any set');

}
