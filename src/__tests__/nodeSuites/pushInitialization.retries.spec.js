import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import authPushEnabled from '../mocks/auth.pushEnabled.facundo@split.io';

import { nearlyEqual } from '../utils';


import EventSourceMock, { setConstructorListener } from '../../sync/__tests__/mocks/eventSourceMock';
import { __setEventSource } from '../../services/getEventSource/node';
__setEventSource(EventSourceMock);

import { SplitFactory } from '../../index';
import SettingsFactory from '../../utils/settings';

const MILLIS_ERROR_MARGIN = 50;

const baseUrls = {
  sdk: 'https://sdk.baseurl/api',
  events: 'https://events.baseurl/api',
  auth: 'https://auth.baseurl/api'
};
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  urls: baseUrls,
  startup: {
    eventsFirstPushWindow: 3000
  },
  streamingEnabled: true,
  authRetryBackoffBase: 0.5,
  streamingReconnectBackoffBase: 0.5,
  // debug: true,
};
const settings = SettingsFactory(config);

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*) and first auth attempt
 *  0.5 secs: second auth attempt
 *  1.0 sects: polling (/splitChanges, /segmentChanges/*)
 *  1.5 secs: third auth attempt (success but push disabled)
 *  2.0 sects: polling (/splitChanges, /segmentChanges/*)
 */
export function testAuthRetries(mock, assert) {

  const start = Date.now();

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let ready = false;
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

  mock.onGet(settings.url('/auth')).timeoutOnce();
  mock.onGet(settings.url('/auth')).networkErrorOnce();
  mock.onGet(settings.url('/auth')).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    const lapse = Date.now() - start;
    const expected = (config.authRetryBackoffBase * Math.pow(2, 0) + config.authRetryBackoffBase * Math.pow(2, 1)) * 1000;
    assert.true(nearlyEqual(lapse, expected, MILLIS_ERROR_MARGIN), 'third auth attempt (aproximately in 1.5 seconds from first attempt)');
    return [200, authPushDisabled];
  });
  mock.onGet(new RegExp(`${settings.url('/segmentChanges/')}.*`)).reply(200, { since: 10, till: 10, name: 'segmentName', added: [], removed: [] });

  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(lapse < MILLIS_ERROR_MARGIN, 'initial sync');
    return [200, splitChangesMock1];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, config.scheduler.featuresRefreshRate * 1000, MILLIS_ERROR_MARGIN), 'polling');
    return [200, splitChangesMock2];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, config.scheduler.featuresRefreshRate * 1000 * 2, MILLIS_ERROR_MARGIN), 'keep polling since auth success buth with push disabled');
    client.destroy().then(() => {
      assert.end();
    });
    return [200, splitChangesMock2];
  });

}

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth success and sse fail
 *  0.5 secs: second sse attempt
 *  1.0 sects: polling (/splitChanges, /segmentChanges/*)
 *  1.5 secs: third sse attempt (success), syncAll (/splitChanges, /segmentChanges/*)
 */
export function testSSERetries(mock, assert) {

  const start = Date.now();
  const expectedTimeToSSEsuccess = (config.streamingReconnectBackoffBase * Math.pow(2, 0) + config.streamingReconnectBackoffBase * Math.pow(2, 1)) * 1000;

  const splitio = SplitFactory(config);
  const client = splitio.client();
  let ready = false;
  client.on(client.Event.SDK_READY, () => {
    ready = true;
  });

  let sseattempts = 0;
  setConstructorListener(function (eventSourceInstance) {
    if (sseattempts < 2) {
      eventSourceInstance.emitError({ type: 'error' });
    } else {
      const lapse = Date.now() - start;

      assert.true(nearlyEqual(lapse, expectedTimeToSSEsuccess, MILLIS_ERROR_MARGIN), 'third auth attempt (aproximately in 1.5 seconds from first attempt)');
      eventSourceInstance.emitOpen();
    }
    sseattempts++;
  });

  mock.onGet(settings.url('/auth')).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabled];
  });
  mock.onGet(new RegExp(`${settings.url('/segmentChanges/')}.*`)).reply(200, { since: 10, till: 10, name: 'segmentName', added: [], removed: [] });

  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(lapse < MILLIS_ERROR_MARGIN, 'initial sync');
    return [200, splitChangesMock1];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.true(ready, 'client ready before first polling fetch');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, config.scheduler.featuresRefreshRate * 1000, MILLIS_ERROR_MARGIN), 'polling');
    return [200, splitChangesMock2];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, expectedTimeToSSEsuccess, MILLIS_ERROR_MARGIN), 'sync due to success SSE connection');
    client.destroy().then(() => {
      assert.end();
    });

    return [200, splitChangesMock2];
  });

}