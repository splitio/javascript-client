import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authPushEnabled from '../mocks/auth.pushEnabled.node.json';
import authInvalidCredentials from '../mocks/auth.invalidCredentials.txt';
import authNoUserSpecified from '../mocks/auth.noUserSpecified.txt';
import { nearlyEqual, url } from '../testUtils';

import { __setEventSource, __restore } from '../../platform/getEventSource/node';
import EventSourceMock, { setMockListener } from '../testUtils/eventSourceMock';

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
    impressionsRefreshRate: 3000,
    pushRetryBackoffBase: 0.01 // small value to assert rapidly that push is not retried
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  },
  streamingEnabled: true,
  // debug: true,
};
const settings = settingsFactory(config);

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*) and auth (success but push disabled)
 *  0.0 secs: syncAll if falling back to polling (/splitChanges, /segmentChanges/*)
 *  0.1 secs: polling (/splitChanges, /segmentChanges/*)
 */
function testInitializationFail(fetchMock, assert, fallbackToPolling) {
  let start, splitio, client, ready = false;

  fetchMock.get(new RegExp(`${url(settings, '/segmentChanges/')}.*`),
    { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });
  fetchMock.getOnce(url(settings, '/splitChanges?since=-1'), function () {
    const lapse = Date.now() - start;
    // using a higher error margin for Travis, due to a lower performance than local execution
    assert.true(nearlyEqual(lapse, 0, process.env.TRAVIS ? 100 : 50), 'initial sync');
    return { status: 200, body: splitChangesMock1 };
  });

  if (fallbackToPolling) {
    fetchMock.getOnce(url(settings, '/splitChanges?since=1457552620999'), function () {
      assert.true(ready, 'client ready');
      const lapse = Date.now() - start;
      assert.true(nearlyEqual(lapse, 0, process.env.TRAVIS ? 100 : 50), 'polling (first fetch)');
      return { status: 200, body: splitChangesMock2 };
    });
  }

  fetchMock.getOnce(url(settings, '/splitChanges?since=1457552620999'), function () {
    assert.true(ready, 'client ready');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate, process.env.TRAVIS ? 100 : 50), 'polling (second fetch)');
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

  fetchMock.getOnce('https://auth.push-initialization-nopush/api/v2/auth', function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth');
    return { status: 200, body: authPushDisabled };
  });

  testInitializationFail(fetchMock, assert, true);

}

export function testAuthWith401(fetchMock, assert) {
  assert.plan(6);

  fetchMock.getOnce(url(settings, '/v2/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth');
    return { status: 401, body: authInvalidCredentials };
  });

  testInitializationFail(fetchMock, assert, true);

}

export function testAuthWith400(fetchMock, assert) {
  assert.plan(6);

  fetchMock.getOnce(url(settings, '/v2/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth');
    return { status: 400, body: authNoUserSpecified };
  });

  testInitializationFail(fetchMock, assert, true);

}

export function testNoEventSource(fetchMock, assert) {
  assert.plan(3);

  __setEventSource(undefined);

  testInitializationFail(fetchMock, assert, false);

  __restore();

}

export function testSSEWithNonRetryableError(fetchMock, assert) {
  assert.plan(7);

  // Auth successes
  fetchMock.getOnce(url(settings, '/v2/auth'), function (url, opts) {
    if (!opts.headers['Authorization']) assert.fail('`/v2/auth` request must include `Authorization` header');
    assert.pass('auth successes');
    return { status: 200, body: authPushEnabled };
  });
  // But SSE fails with a non-recoverable error
  __setEventSource(EventSourceMock);
  setMockListener(function (eventSourceInstance) {
    assert.pass('sse fails');
    const ably4XXNonRecoverableError = { data: '{"message":"Token expired","code":42910,"statusCode":429}' };
    eventSourceInstance.emitError(ably4XXNonRecoverableError);
  });

  testInitializationFail(fetchMock, assert, true);
  __restore();
}
