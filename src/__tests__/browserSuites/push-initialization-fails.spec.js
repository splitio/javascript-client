import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';

import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authInvalidCredentials from '../mocks/auth.invalidCredentials.txt';

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
  scheduler: {
    featuresRefreshRate: 0.1,
    segmentsRefreshRate: 0.1,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  },
  streamingEnabled: true,
  // debug: true,
};
const settings = SettingsFactory(config);

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*) and auth (success but push disabled)
 *  0.1 secs: polling (/splitChanges, /mySegments/*)
 */
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

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*) and auth (fail 401)
 *  0.1 secs: polling (/splitChanges, /segmentChanges/*)
 */
export function testAuthWith401(mock, assert) {

  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (config) {
    if (!config.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return [401, authInvalidCredentials];
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
