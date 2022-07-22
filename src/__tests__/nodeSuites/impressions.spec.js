import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import { SDK_NOT_READY } from '@splitsoftware/splitio-commons/src/utils/labels';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import { OPTIMIZED } from '@splitsoftware/splitio-commons/src/utils/constants';
import { truncateTimeFrame } from '@splitsoftware/splitio-commons/src/utils/time';
import { url } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsSuite',
  events: 'https://events.baseurl/impressionsSuite'
};

const settings = settingsFactory({
  core: {
    key: '<fake id>'
  },
  urls: baseUrls,
  streamingEnabled: false
});

const config = {
  core: {
    authorizationKey: '<fake-token-2>'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 5
  },
  urls: baseUrls,
  streamingEnabled: false
};

let truncatedTimeFrame;

export default async function(key, fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(url(settings, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: {since:10, till:10, name: 'segmentName', added: [], removed: []} });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let evaluationsStart = 0, readyEvaluationsStart = 0, evaluationsEnd = 0;

  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, opts) => {
    assert.equal(opts.headers.SplitSDKImpressionsMode, OPTIMIZED);
    const data = JSON.parse(opts.body);

    assert.equal(data.length, 3, 'We performed evaluations for three splits, so we should have 3 items total.');

    // finding these validate the feature names collection too
    const dependencyChildImpr = data.filter(e => e.f === 'hierarchical_splits_test')[0];
    const alwaysOnWithConfigImpr = data.filter(e => e.f === 'split_with_config')[0];
    const notExistentSplitImpr = data.filter(e => e.f === 'not_existent_split')[0];

    assert.equal(notExistentSplitImpr.i.length, 1); // Only one, the split not found is filtered by the non existent Split check.
    assert.equal(alwaysOnWithConfigImpr.i.length, 2);
    assert.equal(dependencyChildImpr.i.length, 1);

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(data.some(e => e.f === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(data.some(e => e.f === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');
    assert.true(alwaysOnWithConfigImpr, 'Split evaluated with config should have generated an impression too.');
    assert.false(Object.prototype.hasOwnProperty.call(alwaysOnWithConfigImpr.i[0], 'configuration'), 'Impressions do not change with configuration evaluations.');
    assert.false(Object.prototype.hasOwnProperty.call(alwaysOnWithConfigImpr.i[0], 'config'), 'Impressions do not change with configuration evaluations.');

    function validateImpressionData(output, expected, performedWhenReady = true) {
      assert.equal(output.k, expected.keyName, 'Present impressions should have the correct key.');
      assert.equal(output.b, expected.bucketingKey, 'Present impressions should have the correct bucketingKey.');
      assert.equal(output.t, expected.treatment, 'Present impressions should have the correct treatment.');
      assert.equal(output.r, expected.label, 'Present impressions should have the correct label.');
      assert.equal(output.c, expected.changeNumber, 'Present impressions should have the correct changeNumber.');
      assert.true(output.m >= (performedWhenReady ? readyEvaluationsStart : evaluationsStart) && output.m <= evaluationsEnd, 'Present impressions should have the correct timestamp (test with error margin).');
    }

    validateImpressionData(notExistentSplitImpr.i[0], {
      keyName: 'facundo@split.io', label: SDK_NOT_READY, treatment: 'control',
      bucketingKey: undefined, changeNumber: undefined
    }, false);
    validateImpressionData(dependencyChildImpr.i[0], {
      keyName: 'facundo@split.io', label: 'expected label', treatment: 'on',
      bucketingKey: undefined, changeNumber: 2828282828
    });
    validateImpressionData(alwaysOnWithConfigImpr.i[0], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'o.n',
      bucketingKey: 'test_buck_key', changeNumber: 828282828282
    });

    // Not push impressions with a invalid key (aka matching key)
    assert.true(
      dependencyChildImpr.i.filter(e => e.k !== 'facundo@split.io').length === 0,
      'There should be impressions with valid keys, the sdk will not push a impression with invalid a key'
    );

    client.destroy().then(() => {
      assert.end();
    });

    return 200;
  });

  fetchMock.postOnce(url(settings, '/testImpressions/count'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.equal(data.pf.length, 3, 'We should generated impressions for three features.');

    // finding these validate the feature names collection too
    const dependencyChildImpr = data.pf.filter(e => e.f === 'hierarchical_splits_test')[0];
    const alwaysOnWithConfigImpr = data.pf.filter(e => e.f === 'split_with_config')[0];
    const notExistentSplitImpr = data.pf.filter(e => e.f === 'not_existent_split')[0];

    assert.equal(dependencyChildImpr.rc, 1);
    assert.equal(typeof dependencyChildImpr.m, 'number');
    assert.equal(dependencyChildImpr.m, truncatedTimeFrame);
    assert.equal(alwaysOnWithConfigImpr.rc, 3);
    assert.equal(typeof alwaysOnWithConfigImpr.m, 'number');
    assert.equal(alwaysOnWithConfigImpr.m, truncatedTimeFrame);
    assert.equal(notExistentSplitImpr.rc, 1);
    assert.equal(typeof notExistentSplitImpr.m, 'number');
    assert.equal(notExistentSplitImpr.m, truncatedTimeFrame);

    return 200;
  });

  splitio.Logger.enable();
  evaluationsStart = Date.now();

  assert.equal(client.getTreatment(key, 'not_existent_split'), 'control', `If we try to get an evaluation BEFORE the client is ready, we expect ${SDK_NOT_READY} label on the impression.`);

  await client.ready();

  readyEvaluationsStart = Date.now();
  truncatedTimeFrame = truncateTimeFrame(readyEvaluationsStart);

  // depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
  assert.equal(client.getTreatment(key, 'not_existent_split'), 'control', 'If we try to get an evaluation for a non existent split AFTER the client is ready, it won\'t log an impression.');
  assert.equal(client.getTreatment(key, 'hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
  assert.equal(client.getTreatment(false, 'hierarchical_splits_test'), 'control', 'We should return control with a invalid key and that impression is not tracked.');
  assert.deepEqual(client.getTreatmentWithConfig({
    matchingKey: key, bucketingKey: 'test_buck_key'
  }, 'split_with_config'), { // I'll run this one with bucketing key.
    treatment: 'o.n',
    config: '{"color":"brown","dimensions":{"height":12,"width":14},"text":{"inner":"click me"}}'
  }, 'We should get an evaluation as always.');
  client.getTreatmentWithConfig({ matchingKey: key, bucketingKey: 'test_buck_key'}, 'split_with_config');
  client.getTreatmentWithConfig({ matchingKey: 'different', bucketingKey: 'test_buck_key'}, 'split_with_config');
  splitio.Logger.disable();

  evaluationsEnd = Date.now();
}
