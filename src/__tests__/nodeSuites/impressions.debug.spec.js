import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import { DEBUG } from '@splitsoftware/splitio-commons/src/utils/constants';
import { url } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsDebugSuite',
  events: 'https://events.baseurl/impressionsDebugSuite'
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
    impressionsRefreshRate: 3000,
    impressionsQueueSize: 3 // flush impressions when 3 are queued
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

export default async function (key, fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?s=1.1&since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let evaluationsStart = 0, readyEvaluationsStart = 0, evaluationsEnd = 0;

  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, opts) => {
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

    client.destroy().then(() => {
      validateImpressionData(alwaysOnWithConfigImpr.i[0], {
        keyName: 'facundo@split.io', label: 'another expected label', treatment: 'o.n',
        bucketingKey: 'test_buck_key', changeNumber: 828282828282, pt: undefined
      });
      validateImpressionData(alwaysOnWithConfigImpr.i[1], {
        keyName: 'facundo@split.io', label: 'another expected label', treatment: 'o.n',
        bucketingKey: 'test_buck_key', changeNumber: 828282828282, pt: alwaysOnWithConfigImpr.i[0].m
      });
      validateImpressionData(alwaysOnWithConfigImpr.i[2], {
        keyName: 'facundo@split.io', label: 'another expected label', treatment: 'o.n',
        bucketingKey: 'test_buck_key', changeNumber: 828282828282, pt: alwaysOnWithConfigImpr.i[1].m
      });

      assert.end();
    });

    return 200;
  });

  evaluationsStart = Date.now();

  await client.ready();

  readyEvaluationsStart = Date.now();

  client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key' }, 'split_with_config');
  client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key' }, 'split_with_config');
  client.getTreatment({ matchingKey: key, bucketingKey: 'test_buck_key' }, 'split_with_config');

  evaluationsEnd = Date.now();
}
