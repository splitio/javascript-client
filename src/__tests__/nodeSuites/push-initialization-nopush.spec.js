import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authInvalidCredentials from '../mocks/auth.invalidCredentials.txt';
import { nearlyEqual } from '../utils';

import { __setEventSource, __restore } from '../../services/getEventSource/node';

const baseUrls = {
  sdk: 'https://sdk.push-initialization-nopush/api',
  events: 'https://events.push-initialization-nopush/api',
  auth: 'https://auth.push-initialization-nopush/api'
};
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>'
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
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*) and auth (success but push disabled)
 *  0.0 secs: syncAll if falling back to polling (/splitChanges, /segmentChanges/*)
 *  0.1 secs: polling (/splitChanges, /segmentChanges/*)
 */
function testInitializationFail(fetchMock, assert, fallbackToPolling) {
  let start, splitio, client, ready = false;

  fetchMock.get(new RegExp(`${settings.url('/segmentChanges/')}.*`),
    { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });
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

  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });
  start = Date.now();
}

export function testAuthWithPushDisabled(fetchMock, assert) {
  assert.plan(6);

  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return { status: 200, body: authPushDisabled };
  });

  testInitializationFail(fetchMock, assert, true);

}

export function testAuthWith401(fetchMock, assert) {
  assert.plan(6);

  fetchMock.getOnce(settings.url('/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return { status: 401, body: authInvalidCredentials };
  });

  testInitializationFail(fetchMock, assert, true);

}

export function testNoEventSource(fetchMock, assert) {
  assert.plan(3);

  __setEventSource(undefined);
  fetchMock.getOnce(settings.url('/auth'), function () {
    assert.fail('not authenticate if EventSource is not available');
  });

  testInitializationFail(fetchMock, assert, false);

  __restore();

}