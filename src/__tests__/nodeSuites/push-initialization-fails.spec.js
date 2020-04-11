import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authInvalidCredentials from '../mocks/auth.invalidCredentials.txt';
import { nearlyEqual } from '../utils';

import { __setEventSource, __restore } from '../../services/getEventSource/node';

const baseUrls = {
  sdk: 'https://sdk.push-initialization-fails/api',
  events: 'https://events.push-initialization-fails/api',
  auth: 'https://auth.push-initialization-fails/api'
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
 *  0.1 secs: polling (/splitChanges, /segmentChanges/*)
 */
function testInitializationFail(mock, assert) {
  const start = Date.now();

  mock.onGet(new RegExp(`${settings.url('/segmentChanges/')}.*`)).reply(200, { since: 10, till: 10, name: 'segmentName', added: [], removed: [] });
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

  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, settings.scheduler.featuresRefreshRate), 'polling');
    client.destroy().then(() => {
      assert.end();
    });
    return [200, splitChangesMock2];
  });
}

export function testAuthWithPushDisabled(mock, assert) {

  mock.onGet(settings.url('/auth')).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return [200, authPushDisabled];
  });

  testInitializationFail(mock, assert);

}

export function testAuthWith401(mock, assert) {

  mock.onGet(settings.url('/auth')).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth');
    return [401, authInvalidCredentials];
  });

  testInitializationFail(mock, assert);

}

export function testNoEventSource(mock, assert) {

  __setEventSource(undefined);
  mock.onGet(settings.url('/auth')).replyOnce(function () {
    assert.fail('not authenticate if EventSource is not available');
  });

  testInitializationFail(mock, assert);

  __restore();

}