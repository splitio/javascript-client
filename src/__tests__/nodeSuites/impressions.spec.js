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

export default async function (key, fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?s=1.3&since=1457552620999&rbSince=-1'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let evaluationsStart = 0, readyEvaluationsStart = 0, evaluationsEnd = 0;

  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, opts) => {
    assert.equal(opts.headers.SplitSDKImpressionsMode, OPTIMIZED);
    const data = JSON.parse(opts.body);

    assert.equal(data.length, 3, 'We performed evaluations for 4 features, but one with `impressionsDisabled` true, so we should have 3 items total.');

    // finding these validate the feature names collection too
    const dependencyChildImpr = data.filter(e => e.f === 'hierarchical_splits_test')[0];
    const splitWithConfigImpr = data.filter(e => e.f === 'split_with_config')[0];
    const notExistentSplitImpr = data.filter(e => e.f === 'not_existent_split')[0];
    const alwaysOnWithImpressionsDisabledTrue = data.filter(e => e.f === 'always_on_impressions_disabled_true');

    assert.equal(notExistentSplitImpr.i.length, 1); // Only one, the split not found is filtered by the non existent Split check.
    assert.equal(splitWithConfigImpr.i.length, 3);
    assert.equal(dependencyChildImpr.i.length, 1);
    assert.equal(alwaysOnWithImpressionsDisabledTrue.length, 0);

    assert.true(dependencyChildImpr, 'Split we wanted to evaluate should be present on the impressions.');
    assert.false(data.some(e => e.f === 'hierarchical_dep_always_on'), 'Parent split evaluations should not result in impressions.');
    assert.false(data.some(e => e.f === 'hierarchical_dep_hierarchical'), 'No matter how deep is the chain.');
    assert.true(splitWithConfigImpr, 'Split evaluated with config should have generated an impression too.');
    assert.false(Object.prototype.hasOwnProperty.call(splitWithConfigImpr.i[0], 'configuration'), 'Impressions do not change with configuration evaluations.');
    assert.false(Object.prototype.hasOwnProperty.call(splitWithConfigImpr.i[0], 'config'), 'Impressions do not change with configuration evaluations.');

    function validateImpressionData(output, expected, performedWhenReady = true) {
      assert.equal(output.k, expected.keyName, 'Present impressions should have the correct key.');
      assert.equal(output.b, expected.bucketingKey, 'Present impressions should have the correct bucketingKey.');
      assert.equal(output.t, expected.treatment, 'Present impressions should have the correct treatment.');
      assert.equal(output.r, expected.label, 'Present impressions should have the correct label.');
      assert.equal(output.c, expected.changeNumber, 'Present impressions should have the correct changeNumber.');
      assert.equal(output.properties, expected.properties, 'Present impressions should have the correct properties.');
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
    validateImpressionData(splitWithConfigImpr.i[0], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'o.n',
      bucketingKey: 'test_buck_key', changeNumber: 828282828282
    });
    validateImpressionData(splitWithConfigImpr.i[2], {
      keyName: 'other_key', label: 'another expected label', treatment: 'o.n',
      changeNumber: 828282828282, properties: '{"some":"value2"}'
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

    assert.equal(data.pf.length, 2, 'We should generate impression count for 2 features.');

    // finding these validate the feature names collection too
    const splitWithConfigImpr = data.pf.filter(e => e.f === 'split_with_config')[0];
    const alwaysOnWithImpressionsDisabledTrue = data.pf.filter(e => e.f === 'always_on_impressions_disabled_true')[0];

    assert.equal(splitWithConfigImpr.rc, 1);
    assert.equal(typeof splitWithConfigImpr.m, 'number');
    assert.equal(splitWithConfigImpr.m, truncatedTimeFrame);
    assert.equal(alwaysOnWithImpressionsDisabledTrue.rc, 1);
    assert.equal(typeof alwaysOnWithImpressionsDisabledTrue.m, 'number');
    assert.equal(alwaysOnWithImpressionsDisabledTrue.m, truncatedTimeFrame);

    return 200;
  });

  fetchMock.postOnce(url(settings, '/v1/keys/ss'), (url, opts) => {
    assert.deepEqual(JSON.parse(opts.body), {
      keys: [{ f: 'always_on_impressions_disabled_true', ks: ['other_key'] }]
    }, 'We should only track unique keys for features flags with track impressions disabled.');

    return 200;
  });

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
  client.getTreatmentWithConfig({ matchingKey: key, bucketingKey: 'test_buck_key' }, 'split_with_config');
  client.getTreatmentWithConfig({ matchingKey: 'different', bucketingKey: 'test_buck_key' }, 'split_with_config');

  // Impression should not be tracked (passed properties will not be submitted)
  assert.equal(client.getTreatment('other_key', 'always_on_impressions_disabled_true'), 'on', undefined, { properties: { some: 'value1' } });

  // Tracked impression with properties should be handled in DEBUG mode
  assert.equal(client.getTreatment('other_key', 'split_with_config', undefined, { properties: { some: 'value2' } }), 'o.n');

  evaluationsEnd = Date.now();
}
