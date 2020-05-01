import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authInvalidCredentials from '../mocks/auth.invalidCredentials.txt';
import { nearlyEqual } from '../utils';

const baseUrls = {
  sdk: 'https://sdk.push-initialization-nopush/api',
  events: 'https://events.push-initialization-nopush/api',
  auth: 'https://auth.push-initialization-nopush/api'
};
const userKey = 'nicolas@split.io';
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: userKey
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
 *  0.0 secs: syncAll if falling back to polling (/splitChanges, /mySegments/*)
 *  0.1 secs: polling (/splitChanges, /mySegments/*)
 */
function testInitializationFail(mock, assert, fallbackToPolling) {
  const start = Date.now();

  mock.onGet(settings.url('/mySegments/nicolas@split.io')).reply(200, mySegmentsNicolas);
  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return [200, splitChangesMock1];
  });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let ready = false;
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });
  
  if (fallbackToPolling) {
    mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
      assert.true(ready, 'client ready');
      const lapse = Date.now() - start;
      assert.true(nearlyEqual(lapse, 0), 'polling (first fetch)');
      return [200, splitChangesMock2];
    });
  }

  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.true(ready, 'client ready');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling (second fetch)');
    client.destroy().then(() => {
      assert.end();
    });
    return [200, splitChangesMock2];
  });
}

export function testAuthWithPushDisabled(mock, assert) {

  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return [200, authPushDisabled];
  });

  testInitializationFail(mock, assert, true);

}

export function testAuthWith401(mock, assert) {

  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return [401, authInvalidCredentials];
  });

  testInitializationFail(mock, assert, true);

}

export function testNoEventSource(mock, assert) {

  const originalEventSource = window.EventSource;
  window.EventSource = undefined;
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function () {
    assert.fail('not authenticate if EventSource is not available');
  });

  testInitializationFail(mock, assert, false);

  window.EventSource = originalEventSource;

}

export function testNoBase64Support(mock, assert) {

  const originalAtoB = window.atob;
  window.atob = undefined;
  mock.onGet(settings.url(`/auth?users=${encodeURIComponent(userKey)}`)).replyOnce(function () {
    assert.fail('not authenticate if `atob` or `btoa` functions are not available');
  });

  testInitializationFail(mock, assert, false);

  window.atob = originalAtoB;

}