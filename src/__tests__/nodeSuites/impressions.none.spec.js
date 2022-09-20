import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import { NONE } from '@splitsoftware/splitio-commons/src/utils/constants';
import { truncateTimeFrame } from '@splitsoftware/splitio-commons/src/utils/time';
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
  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

  const splitio = SplitFactory(config);
  const client = splitio.client();

  fetchMock.postOnce(baseUrls.events + '/testImpressions/count', (url, opts) => {
    const data = JSON.parse(opts.body);
    const truncatedTimeFrame = truncateTimeFrame(Date.now());

    assert.deepEqual(data, {
      pf: [
        { f: 'split_with_config', m: truncatedTimeFrame, rc: 3 },
        { f: 'always_off', m: truncatedTimeFrame, rc: 3 },
        { f: 'always_on', m: truncatedTimeFrame, rc: 5 }
      ]
    });
    return 200;
  });

  fetchMock.postOnce(url(settings, '/v1/keys/ss'), (url, opts) => {
    const data = JSON.parse(opts.body);

    assert.deepEqual(data, {
      keys: [
        {
          f: 'split_with_config',
          ks: ['emma@split.io', 'emi@split.io']
        },
        {
          f: 'always_off',
          ks: ['emma@split.io', 'emi@split.io']
        },
        {
          f: 'always_on',
          ks: ['emma@split.io', 'emi@split.io', 'nico@split.io']
        }
      ]
    }, 'We performed evaluations for three split, so we should have 3 item total.');
    return 200;
  });

  await client.ready();

  client.getTreatment('emma@split.io', 'split_with_config');
  client.getTreatment('emma@split.io', 'always_off');
  client.getTreatment('emma@split.io', 'always_on');
  client.getTreatment('emi@split.io', 'always_on');
  client.getTreatment('nico@split.io', 'always_on');
  client.getTreatment('emma@split.io', 'always_off');
  client.getTreatment('emma@split.io', 'always_on');
  client.getTreatment('emi@split.io', 'always_off');
  client.getTreatment('nico@split.io', 'always_on');
  client.getTreatment('emi@split.io', 'split_with_config');
  client.getTreatment('emma@split.io', 'split_with_config');

  client.destroy().then(() => {
    assert.end();
  });
}
