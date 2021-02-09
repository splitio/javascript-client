import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authInvalidCredentials from '../mocks/auth.invalidCredentials.txt';
import { nearlyEqual } from '../testUtils';

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
  debug: true,
};
const settings = SettingsFactory(config);

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*) and auth (success but push disabled)
 *  0.0 secs: syncAll if falling back to polling (/splitChanges, /mySegments/*)
 *  0.1 secs: polling (/splitChanges, /mySegments/*)
 */
function testInitializationFail(fetchMock, assert, fallbackToPolling) {
  let start, splitio, client, ready = false;

  fetchMock.get(settings.url('/mySegments/nicolas%40split.io'), { status: 200, body: mySegmentsNicolas });
  fetchMock.getOnce(settings.url('/splitChanges?since=-1'), function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0), 'initial sync');
    return { status: 200, body: splitChangesMock1 };
  });

  if (fallbackToPolling) {
    fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
      assert.true(ready, 'client ready');
      const lapse = Date.now() - start;
      assert.true(nearlyEqual(lapse, 0), 'polling (first fetch)');
      return { status: 200, body: splitChangesMock2 };
    });
  }

  fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), function () {
    assert.true(ready, 'client ready');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling (second fetch)');
    client.destroy().then(() => {
      assert.end();
    });
    return { status: 200, body: splitChangesMock2 };
  });

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

}

export function testAuthWithPushDisabled(fetchMock, assert) {
  assert.plan(6);

  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return { status: 200, body: authPushDisabled };
  });

  testInitializationFail(fetchMock, assert, true);

}

export function testAuthWith401(fetchMock, assert) {
  assert.plan(6);

  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return { status: 401, body: authInvalidCredentials };
  });

  testInitializationFail(fetchMock, assert, true);

}

export function testNoEventSource(fetchMock, assert) {
  assert.plan(3);

  const originalEventSource = window.EventSource;
  window.EventSource = undefined;
  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), function () {
    assert.fail('not authenticate if EventSource is not available');
  });

  testInitializationFail(fetchMock, assert, false);

  window.EventSource = originalEventSource;

}

export function testNoBase64Support(fetchMock, assert) {
  assert.plan(3);

  const originalAtoB = window.atob;
  window.atob = undefined;
  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), function () {
    assert.fail('not authenticate if `atob` or `btoa` functions are not available');
  });

  testInitializationFail(fetchMock, assert, false);

  window.atob = originalAtoB;

}