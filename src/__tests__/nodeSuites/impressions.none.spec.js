import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import { NONE } from '@splitsoftware/splitio-commons/src/utils/constants';
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
    impressionsQueueSize: 3, // flush impressions when 3 are queued
    uniqueKeysCacheSize: 7 // flush impressions when 3 are queued
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  },
  sync: {
    impressionsMode: NONE
  },
  streamingEnabled: false
};

export default async function (key, fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(url(settings, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(url(settings, '/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });
  fetchMock.postOnce(baseUrls.events + '/testImpressions/count', 200);
  const splitio = SplitFactory(config);
  const client = splitio.client();

  fetchMock.postOnce(url(settings, '/v1/keys/ss'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.equal(data.keys.length, 3, 'We performed evaluations for three split, so we should have 3 item total.');

    function validateImpressionData(output, expected) {
      assert.equal(output.f, expected.featureName, 'Present impressions should have the correct featureName.');
      assert.deepEqual(output.ks, expected.keys, 'Present impressions should have the correct key list.');
    }

    client.destroy().then(() => {
      validateImpressionData(data.keys[0], {
        featureName: 'split_with_config',
        keys:['emma@split.io','emi@split.io']
      });
      validateImpressionData(data.keys[1], {
        featureName: 'always_off',
        keys:['emma@split.io','emi@split.io']
      });
      validateImpressionData(data.keys[2], {
        featureName: 'always_on',
        keys:['emma@split.io','emi@split.io','nico@split.io']
      });
  
      assert.end();

    });
    
    return 200;
  });

  splitio.Logger.enable();

  await client.ready();

  client.getTreatment('emma@split.io', 'split_with_config');
  client.getTreatment('emma@split.io', 'always_off');
  client.getTreatment('emma@split.io', 'always_on');
  client.getTreatment('emi@split.io', 'always_on');
  client.getTreatment('nico@split.io', 'always_on');
  client.getTreatment('emma@split.io', 'always_on');
  client.getTreatment('emi@split.io', 'always_off');
  client.getTreatment('emi@split.io', 'split_with_config');
  client.getTreatment('emma@split.io', 'split_with_config');
  
}
