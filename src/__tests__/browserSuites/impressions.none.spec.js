import { SplitFactory } from '../..';
import { settingsFactory } from '../../settings/node';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import membershipsFacundo from '../mocks/memberships.facundo@split.io.json';
import { NONE } from '@splitsoftware/splitio-commons/src/utils/constants';
import { truncateTimeFrame } from '@splitsoftware/splitio-commons/src/utils/time';
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
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?s=1.3&since=1457552620999&rbSince=-1'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(url(settings, '/memberships/facundo%40split.io'), { status: 200, body: membershipsFacundo });
  fetchMock.get(url(settings, '/memberships/emma%40split.io'), { status: 200, body: membershipsFacundo });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  const sharedClient = splitio.client('emma@split.io');

  fetchMock.postOnce(baseUrls.events + '/testImpressions/count', (url, opts) => {
    const data = JSON.parse(opts.body);
    const truncatedTimeFrame = truncateTimeFrame(Date.now());

    assert.deepEqual(data, {
      pf: [
        { f: 'split_with_config', m: truncatedTimeFrame, rc: 2 },
        { f: 'always_off', m: truncatedTimeFrame, rc: 4 },
        { f: 'always_on', m: truncatedTimeFrame, rc: 2 },
        { f: 'always_on_impressions_disabled_true', m: truncatedTimeFrame, rc: 1 }
      ]
    });
    return 200;
  });

  fetchMock.postOnce(url(settings, '/v1/keys/cs'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.deepEqual(data, {
      keys: [
        {
          k: 'facundo@split.io',
          fs: ['split_with_config', 'always_off', 'always_on']
        },
        {
          k: 'emma@split.io',
          fs: ['always_off', 'always_on', 'always_on_impressions_disabled_true']
        }
      ]
    }, 'We performed evaluations for two keys, so we should have 2 item total.');

    return 200;
  });

  await client.ready();

  client.getTreatment('split_with_config');
  sharedClient.getTreatment('always_off');
  client.getTreatment('always_off');
  sharedClient.getTreatment('always_on');
  sharedClient.getTreatment('always_off');
  client.getTreatment('always_on');
  client.getTreatment('always_off');
  client.getTreatment('split_with_config');
  sharedClient.getTreatment('always_on_impressions_disabled_true');

  client.destroy().then(() => {
    assert.end();
  });
}
