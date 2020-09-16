import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import { DEBUG } from '../../utils/constants';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsSuite',
  events: 'https://events.baseurl/impressionsSuite'
};

const settings = SettingsFactory({
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
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 5
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  },
  sync: {
    impressionsMode: DEBUG
  },
  streamingEnabled: false
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
    assert.equal(opts.headers.SplitSDKImpressionsMode, DEBUG);
    const data = JSON.parse(opts.body);

    assert.equal(data.length, 1, 'We performed evaluations for one split, so we should have 1 item total.');

    // finding these validate the feature names collection too
    const alwaysOnWithConfigImpr = data.filter(e => e.f === 'split_with_config')[0];

    assert.equal(alwaysOnWithConfigImpr.i.length, 3);

    function validateImpressionData(output, expected, performedWhenReady = true) {
      assert.equal(output.k, expected.keyName, 'Present impressions should have the correct key.');
      assert.equal(output.b, expected.bucketingKey, 'Present impressions should have the correct bucketingKey.');
      assert.equal(output.t, expected.treatment, 'Present impressions should have the correct treatment.');
      assert.equal(output.r, expected.label, 'Present impressions should have the correct label.');
      assert.equal(output.c, expected.changeNumber, 'Present impressions should have the correct changeNumber.');
      assert.equal(output.pt, expected.pt, 'Present impressions should have the correct previousTime.');
      assert.true(output.m >= (performedWhenReady ? readyEvaluationsStart : evaluationsStart) && output.m <= evaluationsEnd, 'Present impressions should have the correct timestamp (test with error margin).');
    }

    validateImpressionData(alwaysOnWithConfigImpr.i[0], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'on',
      bucketingKey: 'test_buck_key', changeNumber: 828282828282, pt: undefined
    });
    validateImpressionData(alwaysOnWithConfigImpr.i[1], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'on',
      bucketingKey: 'test_buck_key', changeNumber: 828282828282, pt: alwaysOnWithConfigImpr.i[0].m
    });
    validateImpressionData(alwaysOnWithConfigImpr.i[2], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'on',
      bucketingKey: 'test_buck_key', changeNumber: 828282828282, pt: alwaysOnWithConfigImpr.i[1].m
    });

    client.destroy();
    assert.end();

    return 200;
  });
  fetchMock.postOnce(settings.url('/testImpressions/bulk'), 200);

  splitio.Logger.enable();
  evaluationsStart = Date.now();

  await client.ready();

  readyEvaluationsStart = Date.now();

  client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key'}, 'split_with_config');
  client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key'}, 'split_with_config');
  client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key'}, 'split_with_config');
  splitio.Logger.disable();

  evaluationsEnd = Date.now();
}
