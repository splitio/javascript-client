import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';

import authPushDisabled from '../mocks/auth.pushDisabled.json';
// import authPushEnabledFacundo from '../mocks/auth.pushEnabled.facundo@split.io.json';

const baseUrls = {
  sdk: 'https://sdk.baseurl/api',
  events: 'https://events.baseurl/api',
  auth: 'https://auth.baseurl/api'
};
const userKey = 'facundo@split.io';
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: userKey,
  },
  urls: baseUrls,
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  startup: {
    eventsFirstPushWindow: 3000
  },
  streamingEnabled: true,
  // debug: true,
};
const settings = SettingsFactory(config);

export function testAuthWithPushDisabled(mock, assert) {

  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (config) {
    if (!config.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return [200, authPushDisabled];
  });
  mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    assert.pass('initial sync');
    return [200, splitChangesMock1];
  });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let ready = false;
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.true(ready, 'client ready before first polling fetch');
    assert.pass('polling');
    client.destroy();
    assert.end();
    return [200, splitChangesMock2];
  });

}
