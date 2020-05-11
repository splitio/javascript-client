import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import { SDK_NOT_READY } from '../../utils/labels';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsSuite',
  events: 'https://events.baseurl/impressionsSuite'
};

const settings = SettingsFactory({
  core: {
    key: '<fake id>'
  },
  urls: baseUrls
});

const config = {
  core: {
    authorizationKey: '<fake-token-2>'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 5
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  }
};

export default async function(key, fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(settings.url('/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(new RegExp(`${settings.url('/segmentChanges/')}.*`), { status: 200, body: {since:10, till:10, name: 'segmentName', added: [], removed: []} });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let evaluationsStart = 0, readyEvaluationsStart = 0, evaluationsEnd = 0;

  fetchMock.postOnce(settings.url('/testImpressions/bulk'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.equal(data.length, 3, 'We performed evaluations for three splits, so we should have 3 items total.');

    // finding these validate the feature names collection too
    const dependencyChildImpr = data.filter(e => e.testName === 'hierarchical_splits_test')[0];
    const alwaysOnWithConfigImpr = data.filter(e => e.testName === 'split_with_config')[0];
    const notExistentSplitImpr = data.filter(e => e.testName === 'not_existent_split')[0];

    assert.equal(notExistentSplitImpr.keyImpressions.length, 1); // Only one, the split not found is filtered by the non existent Split check.
    assert.equal(alwaysOnWithConfigImpr.keyImpressions.length, 1);
    assert.equal(dependencyChildImpr.keyImpressions.length, 1);

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(data.some(e => e.testName === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(data.some(e => e.testName === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');
    assert.true(alwaysOnWithConfigImpr, 'Split evaluated with config should have generated an impression too.');
    assert.false(Object.prototype.hasOwnProperty.call(alwaysOnWithConfigImpr.keyImpressions[0], 'configuration'), 'Impressions do not change with configuration evaluations.');
    assert.false(Object.prototype.hasOwnProperty.call(alwaysOnWithConfigImpr.keyImpressions[0], 'config'), 'Impressions do not change with configuration evaluations.');

    function validateImpressionData(output, expected, performedWhenReady = true) {
      assert.equal(output.keyName, expected.keyName, 'Present impressions should have the correct key.');
      assert.equal(output.bucketingKey, expected.bucketingKey, 'Present impressions should have the correct bucketingKey.');
      assert.equal(output.treatment, expected.treatment, 'Present impressions should have the correct treatment.');
      assert.equal(output.label, expected.label, 'Present impressions should have the correct label.');
      assert.equal(output.changeNumber, expected.changeNumber, 'Present impressions should have the correct changeNumber.');
      assert.true(output.time >= (performedWhenReady ? readyEvaluationsStart : evaluationsStart) && output.time <= evaluationsEnd, 'Present impressions should have the correct timestamp (test with error margin).');
    }

    validateImpressionData(notExistentSplitImpr.keyImpressions[0], {
      keyName: 'facundo@split.io', label: SDK_NOT_READY, treatment: 'control',
      bucketingKey: undefined, changeNumber: undefined
    }, false);
    validateImpressionData(dependencyChildImpr.keyImpressions[0], {
      keyName: 'facundo@split.io', label: 'expected label', treatment: 'on',
      bucketingKey: undefined, changeNumber: 2828282828
    });
    validateImpressionData(alwaysOnWithConfigImpr.keyImpressions[0], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'on',
      bucketingKey: 'test_buck_key', changeNumber: 828282828282
    });

    // Not push impressions with a invalid key (aka matching key)
    assert.true(
      dependencyChildImpr.keyImpressions.filter(e => e.keyName !== 'facundo@split.io').length === 0,
      'There should be impressions with valid keys, the sdk will not push a impression with invalid a key'
    );

    client.destroy();
    assert.end();

    return 200;
  });
  fetchMock.postOnce(settings.url('/testImpressions/bulk'), 200);

  splitio.Logger.enable();
  evaluationsStart = Date.now();

  assert.equal(client.getTreatment(key, 'not_existent_split'), 'control', `If we try to get an evaluation BEFORE the client is ready, we expect ${SDK_NOT_READY} label on the impression.`);

  await client.ready();

  readyEvaluationsStart = Date.now();

  // depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
  assert.equal(client.getTreatment(key, 'not_existent_split'), 'control', 'If we try to get an evaluation for a non existent split AFTER the client is ready, it won\'t log an impression.');
  assert.equal(client.getTreatment(key, 'hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
  assert.equal(client.getTreatment(false, 'hierarchical_splits_test'), 'control', 'We should return control with a invalid key and that impression is not tracked.');
  assert.deepEqual(client.getTreatmentWithConfig({
    matchingKey: key, bucketingKey: 'test_buck_key'
  }, 'split_with_config'), { // I'll run this one with bucketing key.
    treatment: 'on',
    config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
  }, 'We should get an evaluation as always.');
  splitio.Logger.disable();

  evaluationsEnd = Date.now();
}
