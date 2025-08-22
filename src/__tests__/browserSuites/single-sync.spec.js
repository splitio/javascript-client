import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import { url } from '../testUtils';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import membershipsNicolasMock2 from '../mocks/memberships.nicolas@split.io.json';

const baseUrls = {
  sdk: 'https://sdk.single-sync/api',
  events: 'https://events.single-sync/api',
};
const userKey = 'nicolas@split.io';
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: userKey
  },
  scheduler: {
    featuresRefreshRate: 0.2,
    segmentsRefreshRate: 0.2,
    impressionsRefreshRate: 3000,
    pushRetryBackoffBase: 0.1
  },
  urls: baseUrls,
  userConsent: 'UNKNOWN',
  startup: {
    eventsFirstPushWindow: 3000
  },
  sync: {
    enabled: false
  },
  streamingEnabled: true,
};
const settings = settingsFactory(config);

export default function singleSync(fetchMock, assert) {

  fetchMock.getOnce(url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), function () {
    assert.pass('first splitChanges fetch');
    return { status: 200, body: splitChangesMock1 };
  });
  fetchMock.getOnce('begin:'+url(settings, '/splitChanges?'), function () {
    assert.fail('splitChanges should not be called again');
    return { status: 200, body: splitChangesMock2 };
  });

  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), function () {
    assert.pass('first memberships fetch');
    return { status: 200, body: membershipsNicolasMock2 };
  });
  fetchMock.getOnce(url(settings, '/memberships/nicolas%40split.io'), function () {
    assert.fail('memberships should not be called again');
    return { status: 200, body: membershipsNicolasMock2 };
  });

  let splitio, client = false;

  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    setTimeout(() => client.destroy().then(() => assert.end()), 1000);
  });

}
