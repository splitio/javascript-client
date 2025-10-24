import sinon from 'sinon';
import { SplitFactory } from '../../';

const listener = {
  logImpression: sinon.stub()
};

const baseConfig = {
  core: {
    authorizationKey: '<fake-token>'
  },
  sync: {
    impressionsMode: 'DEBUG'
  },
  streamingEnabled: false
};

export default async function (fetchMock, assert) {

  assert.test('FallbackTreatment / Split factory with no fallbackTreatment defined', async t => {

    const splitio = SplitFactory(baseConfig);
    const client = splitio.client();

    await client.ready();

    t.equal(client.getTreatment('emi@harness.io', 'non_existent_flag'), 'control', 'The evaluation will return `control` if the flag does not exist and no fallbackTreatment is defined');
    t.equal(client.getTreatment('emma@harness.io', 'non_existent_flag_2'), 'control', 'The evaluation will return `control` if the flag does not exist and no fallbackTreatment is defined');

    await client.destroy();
    t.end();

  });

  assert.test('FallbackTreatment / Split factory with global fallbackTreatment defined', async t => {

    const config = Object.assign({}, baseConfig);
    config.fallbackTreatments = {
      global: 'FALLBACK_TREATMENT'
    };
    const splitio = SplitFactory(config);
    const client = splitio.client();

    await client.ready();


    t.equal(client.getTreatment('emi@harness.io', 'non_existent_flag'), 'FALLBACK_TREATMENT', 'The evaluation will return `FALLBACK_TREATMENT` if the flag does not exist and no fallbackTreatment is defined');
    t.equal(client.getTreatment('emma@harness.io', 'non_existent_flag_2'), 'FALLBACK_TREATMENT', 'The evaluation will return `FALLBACK_TREATMENT` if the flag does not exist and no fallbackTreatment is defined');

    await client.destroy();
    t.end();

  });

  assert.test('FallbackTreatment / Split factory with specific fallbackTreatment defined', async t => {

    const config = Object.assign({}, baseConfig);
    config.fallbackTreatments = {
      byFlag: {
        'non_existent_flag': 'FALLBACK_TREATMENT',
      }
    };
    const splitio = SplitFactory(config);
    const client = splitio.client();

    await client.ready();

    t.equal(client.getTreatment('emi@harness.io', 'non_existent_flag'), 'FALLBACK_TREATMENT', 'The evaluation will return `FALLBACK_TREATMENT` if the flag does not exist and no fallbackTreatment is defined');
    t.equal(client.getTreatment('emi@harness.io', 'non_existent_flag_2'), 'control', 'The evaluation will return `control` if the flag does not exist and no fallbackTreatment is defined');

    t.equal(client.getTreatment('emma@harness.io', 'non_existent_flag'), 'FALLBACK_TREATMENT', 'The evaluation will return `FALLBACK_TREATMENT` if the flag does not exist and no fallbackTreatment is defined');
    t.equal(client.getTreatment('emma@harness.io', 'non_existent_flag_2'), 'control', 'The evaluation will return `control` if the flag does not exist and no fallbackTreatment is defined');

    await client.destroy();
    t.end();

  });


  assert.test('FallbackTreatment / flag override beats global fallbackTreatment', async t => {

    const config = Object.assign({}, baseConfig);
    config.fallbackTreatments = {
      global: 'OFF_FALLBACK',
      byFlag: {
        'my_flag': 'ON_FALLBACK',
      }
    };
    const splitio = SplitFactory(config);
    const client = splitio.client();

    await client.ready();

    t.equal(client.getTreatment('emi@harness.io', 'my_flag'), 'ON_FALLBACK', 'The evaluation will return `ON_FALLBACK` if the flag does not exist and no fallbackTreatment is defined');
    t.equal(client.getTreatment('emi@harness.io', 'non_existent_flag_2'), 'OFF_FALLBACK', 'The evaluation will return `OFF_FALLBACK` if the flag does not exist and no fallbackTreatment is defined');

    t.equal(client.getTreatment('emma@harness.io', 'my_flag'), 'ON_FALLBACK', 'The evaluation will return `ON_FALLBACK` if the flag does not exist and no fallbackTreatment is defined');
    t.equal(client.getTreatment('emma@harness.io', 'non_existent_flag_2'), 'OFF_FALLBACK', 'The evaluation will return `OFF_FALLBACK` if the flag does not exist and no fallbackTreatment is defined');

    await client.destroy();
    t.end();

  });

  assert.test('FallbackTreatment / override applies only when original is control', async t => {

    const config = Object.assign({}, baseConfig);
    config.fallbackTreatments = {
      global: 'OFF_FALLBACK'
    };
    const splitio = SplitFactory(config);
    const client = splitio.client();

    await client.ready();

    t.equal(client.getTreatment('emma@harness.io', 'user_account_in_whitelist'), 'off', 'The evaluation will return the treatment defined in the flag if it exists');
    t.equal(client.getTreatment('emma@harness.io', 'non_existent_flag'), 'OFF_FALLBACK', 'The evaluation will return `OFF_FALLBACK` if the flag does not exist and no fallbackTreatment is defined');

    await client.destroy();
    t.end();

  });

  assert.test('FallbackTreatment / Impressions correctness with fallback when client is not ready', async t => {

    const config = Object.assign({}, baseConfig);
    config.urls = {
      events: 'https://events.fallbacktreatment/api'
    };
    config.fallbackTreatments = {
      byFlag: {
        'any_flag': 'OFF_FALLBACK'
      }
    };
    const splitio = SplitFactory(config);
    const client = splitio.client();

    t.equal(client.getTreatment('emi@harness.io', 'any_flag'), 'OFF_FALLBACK', 'The evaluation will return the fallbackTreatment if the client is not ready yet');
    t.equal(client.getTreatment('emma@harness.io', 'user_account_in_whitelist'), 'control', 'The evaluation will return the fallbackTreatment if the client is not ready yet');

    await client.ready();

    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', (_, opts) => {

      const payload = JSON.parse(opts.body);

      function validateImpressionData(featureFlagName, expectedLabel) {
        const impressions = payload.find(e => e.f === featureFlagName).i;

        t.equal(impressions[0].r, expectedLabel, `${featureFlagName} impression with label ${expectedLabel}`);
      }

      validateImpressionData('any_flag', 'fallback - not ready');
      validateImpressionData('user_account_in_whitelist', 'not ready');
      t.end();

      return 200;
    });

    await client.destroy();

  });

  assert.test('FallbackTreatment / Fallback dynamic config propagation', async t => {

    const config = Object.assign({}, baseConfig);
    config.fallbackTreatments = {
      global: { treatment: 'OFF_FALLBACK', config: '{"global": true}' },
      byFlag: {
        'my_flag': { treatment: 'ON_FALLBACK', config: '{"flag": true}' }
      }
    };
    const splitio = SplitFactory(config);
    const client = splitio.client();

    await client.ready();

    t.deepEqual(client.getTreatmentWithConfig('emma@harness.io', 'my_flag'), { treatment: 'ON_FALLBACK', config: '{"flag": true}' }, 'The evaluation will propagate the config along with the treatment from the fallbackTreatment');
    t.deepEqual(client.getTreatmentWithConfig('emma@harness.io', 'non_existent_flag'), { treatment: 'OFF_FALLBACK', config: '{"global": true}' }, 'The evaluation will propagate the config along with the treatment from the fallbackTreatment');

    await client.destroy();
    t.end();

  });

  assert.test('FallbackTreatment / Evaluations non existing flags with fallback do not generate impressions', async t => {

    const config = Object.assign({}, baseConfig);
    config.urls = {
      events: 'https://events.fallbacktreatment/api'
    };
    config.fallbackTreatments = {
      global: { treatment: 'OFF_FALLBACK', config: '{"global": true}' },
      byFlag: {
        'my_flag': { treatment: 'ON_FALLBACK', config: '{"flag": true}' }
      }
    };
    config.impressionListener = listener;

    const splitio = SplitFactory(config);
    const client = splitio.client();

    await client.ready();

    t.deepEqual(client.getTreatmentWithConfig('emma@harness.io', 'my_flag'), { treatment: 'ON_FALLBACK', config: '{"flag": true}' }, 'The evaluation will propagate the config along with the treatment from the fallbackTreatment');
    t.deepEqual(client.getTreatmentWithConfig('emma@harness.io', 'non_existent_flag'), { treatment: 'OFF_FALLBACK', config: '{"global": true}' }, 'The evaluation will propagate the config along with the treatment from the fallbackTreatment');

    let POSTED_IMPRESSIONS_COUNT = 0;

    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', (_, opts) => {

      const payload = JSON.parse(opts.body);
      t.equal(payload.length, 1, 'We should have just one impression for the two evaluated flags');

      function validateImpressionData(featureFlagName, expectedLength) {

        const impressions = payload.find(e => e.f === featureFlagName).i;
        t.equal(impressions.length, expectedLength, `${featureFlagName} has ${expectedLength} impressions`);
      }

      validateImpressionData('my_flag', 1);
      validateImpressionData('non_existent_flag', 0);
      POSTED_IMPRESSIONS_COUNT = payload.reduce((acc, curr) => acc + curr.i.length, 0);
      t.equal(POSTED_IMPRESSIONS_COUNT, 1, 'We should have just one impression in total.');

      return 200;
    });

    setTimeout(() => {
      t.equal(listener.logImpression.callCount, POSTED_IMPRESSIONS_COUNT, 'Impression listener should be called once per each impression generated.');

      t.end();
    }, 0);
    await client.destroy();


  });

  assert.test('FallbackTreatment / LocalhostMode', async t => {

    const config = Object.assign({}, baseConfig);
    config.core.authorizationKey = 'localhost';
    config.fallbackTreatments = {
      global: 'OFF_FALLBACK'
    };
    const splitio = SplitFactory(config);
    const client = splitio.client();

    await client.ready();

    t.deepEqual(client.getTreatment('emma@harness.io', 'workspaces_v1'), 'on', 'The evaluation should return the treatment defined in localhost mode');
    t.deepEqual(client.getTreatment('emma@harness.io', 'non_existent_flag'), 'OFF_FALLBACK', 'The evaluation will return `OFF_FALLBACK` if the flag does not exist');

    await client.destroy();

    t.end();
  });


  assert.end();
}
