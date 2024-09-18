import sinon from 'sinon';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.semver.json';

import { SplitFactory } from '../../';

const listener = {
  logImpression: sinon.stub()
};

const config = {
  core: {
    authorizationKey: '<fake-token>'
  },
  urls: {
    sdk: 'https://sdk.evaluation-semver/api',
    events: 'https://events.evaluation-semver/api'
  },
  sync: {
    impressionsMode: 'DEBUG'
  },
  impressionListener: listener,
  streamingEnabled: false
};

export default async function (fetchMock, assert) {

  fetchMock.getOnce(config.urls.sdk + '/splitChanges?s=1.1&since=-1', { status: 200, body: splitChangesMock1 });
  fetchMock.get(config.urls.sdk + '/splitChanges?s=1.1&since=1675259356568', { status: 200, body: { splits: [], since: 1675259356568, till: 1675259356568 } });

  const splitio = SplitFactory(config);
  const client = splitio.client();

  await client.ready();

  // EQUAL_TO_SEMVER matcher
  assert.equal(client.getTreatment('emi@split.io', 'semver_equalto', { 'version': '1.22.9' }), 'on', 'the rule will return `on` if attribute `version` is equal to `1.22.9`');
  assert.equal(client.getTreatment('emi@split.io', 'semver_equalto', { 'version': '1.22.9+build' }), 'off', 'build metadata is not ignored');
  assert.equal(client.getTreatment('emi@split.io', 'semver_equalto', { 'version': '1.22.9-rc.0' }), 'off', 'the rule will return `off` if attribute `version` is not equal to `1.22.9`');
  assert.equal(client.getTreatment('emi@split.io', 'semver_equalto', { 'version': null }), 'off', 'the rule will return `off` if attribute `version` is not the expected type');
  assert.equal(client.getTreatment('emi@split.io', 'semver_equalto'), 'off', 'the rule will return `off` if attribute `version` is not provided');

  // IN_LIST_SEMVER matcher
  assert.equal(client.getTreatment('emi@split.io', 'semver_inlist', { 'version': '2.1.0' }), 'on', 'the rule will return `on` if attribute `version` is in list (`1.22.9`, `2.1.0`)');
  assert.equal(client.getTreatment('emi@split.io', 'semver_inlist', { 'version': '1.22.9' }), 'on', 'the rule will return `on` if attribute `version` is in list (`1.22.9`, `2.1.0`)');
  assert.equal(client.getTreatment('emi@split.io', 'semver_inlist', { 'version': '1.22.9+build' }), 'off', 'build metadata is not ignored');
  assert.equal(client.getTreatment('emi@split.io', 'semver_inlist', { 'version': '1.22.9-rc.0' }), 'off', 'the rule will return `off` if attribute `version` is not in list (`1.22.9`, `2.1.0`)');
  assert.equal(client.getTreatment('emi@split.io', 'semver_inlist', { 'version': null }), 'off', 'the rule will return `off` if attribute `version` is not the expected type');

  // GREATER_THAN_OR_EQUAL_TO_SEMVER matcher
  assert.equal(client.getTreatments({ matchingKey: 'rulo@split.io', bucketingKey: 'some_bucket' }, ['semver_greater_or_equalto'], { 'version': '1.23.9' }).semver_greater_or_equalto, 'on', 'the rule will return `on` if attribute `version` is greater than or equal to `1.22.9`');
  assert.equal(client.getTreatments({ matchingKey: 'rulo@split.io', bucketingKey: 'some_bucket' }, ['semver_greater_or_equalto'], { 'version': '1.22.9' }).semver_greater_or_equalto, 'on', 'the rule will return `on` if attribute `version` is greater than or equal to `1.22.9`');
  assert.equal(client.getTreatments({ matchingKey: 'rulo@split.io', bucketingKey: 'some_bucket' }, ['semver_greater_or_equalto'], { 'version': '1.22.9+build' }).semver_greater_or_equalto, 'on', 'build metadata is ignored');
  assert.equal(client.getTreatments({ matchingKey: 'rulo@split.io', bucketingKey: 'some_bucket' }, ['semver_greater_or_equalto'], { 'version': '1.22.9-rc.0' }).semver_greater_or_equalto, 'off', 'the rule will return `off` if attribute `version` is not greater than or equal to `1.22.9`');
  assert.equal(client.getTreatments({ matchingKey: 'rulo@split.io', bucketingKey: 'some_bucket' }, ['semver_greater_or_equalto'], { 'version': '1.21.9' }).semver_greater_or_equalto, 'off', 'the rule will return `off` if attribute `version` is not greater than or equal to `1.22.9`');
  assert.equal(client.getTreatments({ matchingKey: 'rulo@split.io', bucketingKey: 'some_bucket' }, ['semver_greater_or_equalto'], { 'version': 'invalid' }).semver_greater_or_equalto, 'off', 'the rule will return `off` if attribute `version` is an invalid semver value');

  // LESS_THAN_OR_EQUAL_TO_SEMVER matcher
  assert.deepEqual(client.getTreatmentWithConfig('emi@split.io', 'semver_less_or_equalto', { 'version': '1.22.11' }), { treatment: 'off', config: null }, 'the rule will return `off` if attribute `version` is not less than or equal to `1.22.9`');
  assert.deepEqual(client.getTreatmentWithConfig('emi@split.io', 'semver_less_or_equalto', { 'version': '1.22.9' }), { treatment: 'on', config: null }, 'the rule will return `on` if attribute `version` is less than or equal to `1.22.9`');
  assert.deepEqual(client.getTreatmentWithConfig('emi@split.io', 'semver_less_or_equalto', { 'version': '1.22.9+build' }), { treatment: 'on', config: null }, 'build metadata is ignored');
  assert.deepEqual(client.getTreatmentWithConfig('emi@split.io', 'semver_less_or_equalto', { 'version': '1.22.9-rc.0' }), { treatment: 'on', config: null }, 'the rule will return `on` if attribute `version` is less than or equal to `1.22.9`');
  assert.deepEqual(client.getTreatmentWithConfig('emi@split.io', 'semver_less_or_equalto', { 'version': '1.21.9' }), { treatment: 'on', config: null }, 'the rule will return `on` if attribute `version` is less than or equal to `1.22.9`');
  assert.deepEqual(client.getTreatmentWithConfig('emi@split.io', 'semver_less_or_equalto', { 'version': {} }), { treatment: 'off', config: null }, 'the rule will return `off` if attribute `version` is not the expected type');

  // BETWEEN_SEMVER matcher
  assert.deepEqual(client.getTreatmentsWithConfig('emi@split.io', ['semver_between'], { 'version': '2.1.1' }).semver_between, { treatment: 'off', config: null }, 'the rule will return `off` if attribute `version` is not between `1.22.9` and `2.1.0`');
  assert.deepEqual(client.getTreatmentsWithConfig('emi@split.io', ['semver_between'], { 'version': '2.1.0+build' }).semver_between, { treatment: 'on', config: null }, 'build metadata is ignored');
  assert.deepEqual(client.getTreatmentsWithConfig('emi@split.io', ['semver_between'], { 'version': '1.25.0' }).semver_between, { treatment: 'on', config: null }, 'the rule will return `on` if attribute `version` is between `1.22.9` and `2.1.0`');
  assert.deepEqual(client.getTreatmentsWithConfig('emi@split.io', ['semver_between'], { 'version': '1.22.9' }).semver_between, { treatment: 'on', config: null }, 'the rule will return `on` if attribute `version` is between `1.22.9` and `2.1.0`');
  assert.deepEqual(client.getTreatmentsWithConfig('emi@split.io', ['semver_between'], { 'version': '1.22.9-rc.0' }).semver_between, { treatment: 'off', config: null }, 'the rule will return `off` if attribute `version` is not between `1.22.9` and `2.1.0`');
  assert.deepEqual(client.getTreatmentsWithConfig('emi@split.io', ['semver_between'], { 'version': [] }).semver_between, { treatment: 'off', config: null }, 'the rule will return `off` if attribute `version` is not the expected type');

  // Evaluation of a flag with unsupported matcher
  assert.equal(client.getTreatment('any-key', 'flag_with_unsupported_matcher'), 'control', 'evaluation of a flag with an unsupported matcher should return control');

  let POSTED_IMPRESSIONS_COUNT;

  fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', (_, opts) => {

    const payload = JSON.parse(opts.body);

    function validateImpressionData(featureFlagName, expectedImpressionCount, expectedOnCount, expectedLabel, expectedTreatment = 'on') {
      const impressions = payload.find(e => e.f === featureFlagName).i;

      assert.equal(impressions.length, expectedImpressionCount, `We should have ${expectedImpressionCount} impressions for the feature flag ${featureFlagName}`);
      assert.equal(impressions.filter((imp) => imp.r === expectedLabel && imp.t === expectedTreatment).length, expectedOnCount, `${expectedOnCount} impression with 'on' treatment and label ${expectedLabel}`);
    }

    validateImpressionData('semver_equalto', 5, 1, 'equal to semver');
    validateImpressionData('semver_inlist', 5, 2, 'in list semver');
    validateImpressionData('semver_greater_or_equalto', 6, 3, 'greater than or equal to semver');
    validateImpressionData('semver_less_or_equalto', 6, 4, 'less than or equal to semver');
    validateImpressionData('semver_between', 6, 3, 'between semver');
    validateImpressionData('flag_with_unsupported_matcher', 1, 1, 'targeting rule type unsupported by sdk', 'control');

    POSTED_IMPRESSIONS_COUNT = payload.reduce((acc, curr) => acc + curr.i.length, 0);

    return 200;
  });

  await client.destroy();

  setTimeout(() => {
    assert.equal(listener.logImpression.callCount, POSTED_IMPRESSIONS_COUNT, 'Impression listener should be called once per each impression generated.');

    assert.end();
  }, 0);
}
