import { SplitFactory } from '../..';
import { settingsFactory } from '../../settings/node';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';
import { NONE } from '@splitsoftware/splitio-commons/src/utils/constants';
import { url } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsNoneSuite',
  events: 'https://events.baseurl/impressionsNoneSuite'
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
    authorizationKey: '<some-token>',
    key: 'facundo@split.io'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 3000,
    impressionsQueueSize: 3, // flush impressions when 3 are queued
    uniqueKeysCacheSize: 3 // flush impressions when 3 are queued
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

export default async function (fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(url(settings, '/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(url(settings, '/mySegments/facundo%40split.io'), { status: 200, body: mySegmentsFacundo });
  fetchMock.get(url(settings, '/mySegments/emma%40split.io'), { status: 200, body: mySegmentsFacundo });
  fetchMock.postOnce(baseUrls.events + '/testImpressions/count', 200);
  const splitio = SplitFactory(config);
  const client = splitio.client();
  const sharedClient = splitio.client('emma@split.io');

  fetchMock.postOnce(url(settings, '/v1/keys/cs'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.deepEqual(data, {
      keys: [
        {
          k: 'facundo@split.io',
          fs: ['split_with_config','always_off', 'always_on']
        },
        {
          k: 'emma@split.io',
          fs: ['always_off', 'always_on']
        }
      ]
    }, 'We performed evaluations for two keys, so we should have 2 item total.');
    
    client.destroy().then(() => {  
      assert.end();

    });
    
    return 200;
  });

  splitio.Logger.enable();

  await client.ready();

  client.getTreatment('split_with_config');
  sharedClient.getTreatment('always_off');
  client.getTreatment('always_off');
  sharedClient.getTreatment('always_on');
  sharedClient.getTreatment('always_off');
  client.getTreatment('always_on');
  client.getTreatment('always_off');
  client.getTreatment('split_with_config');
  
}
