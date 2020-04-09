import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import splitChangesMock3 from '../mocks/splitchanges.since.1457552620999.till.1457552631000.json';
import newSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552631000.json';
import oldSplitUpdateMessage from '../mocks/message.SPLIT_UPDATE.1457552620999.json';
import authPushEnabled from '../mocks/auth.pushEnabled.facundo@split.io';

import { nearlyEqual } from '../utils';


import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';
import { __setEventSource } from '../../services/getEventSource/node';
__setEventSource(EventSourceMock);

import { SplitFactory } from '../../index';
import SettingsFactory from '../../utils/settings';

const MILLIS_ERROR_MARGIN = 50;

const key = 'emiliano@split.io';

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
    featuresRefreshRate: 3000,
    segmentsRefreshRate: 3000,
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
 *  0.0 secs: initial SyncAll (/splitChanges, /segmentChanges/*), auth, SSE connection
 *  0.5 sects: SSE connection opened -> syncAll (/splitChanges, /segmentChanges/*)
 *  1.0 secs: new SPLIT_UPDATE event -> /splitChanges
 *  1.5 sects: old SPLIT_UPDATE event
 */
export function testSplitUpdate(mock, assert) {

  const MILLIS_SSE_OPEN = 500;
  const MILLIS_FIRST_SPLIT_UPDATE_EVENT = 1000;
  const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 1500;

  const start = Date.now();

  const splitio = SplitFactory(config);
  const client = splitio.client();

  setMockListener(function (eventSourceInstance) {
    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.5 seconds
    setTimeout(() => {
      eventSourceInstance.emitMessage(newSplitUpdateMessage);
    }, MILLIS_FIRST_SPLIT_UPDATE_EVENT); // send a SPLIT_UPDATE event with a new changeNumber after 1 seconds
    setTimeout(() => {
      eventSourceInstance.emitMessage(oldSplitUpdateMessage);
    }, MILLIS_SECOND_SPLIT_UPDATE_EVENT); // send an old SPLIT_UPDATE event with an old changeNumber after 1 seconds
    setTimeout(() => {
      assert.equal(client.getTreatment(key, 'whitelist'), 'allowed', 'treatment value of updated Split');
      client.destroy().then(() => {
        assert.end();
      });
    }, MILLIS_SECOND_SPLIT_UPDATE_EVENT + 500);
  });

  mock.onGet(settings.url('/auth')).replyOnce(function (request) {
    if (!request.headers['Authorization']) assert.fail('`/auth` request must include `Authorization` header');
    assert.pass('auth success');
    return [200, authPushEnabled];
  });
  mock.onGet(new RegExp(`${settings.url('/segmentChanges/')}.*`)).reply(200, { since: 10, till: 10, name: 'segmentName', added: [], removed: [] });

  mock.onGet(settings.url('/splitChanges?since=-1')).replyOnce(function () {
    assert.equal(client.getTreatment(key, 'whitelist'), 'control', 'control treatment value, since SDK is not ready');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, 0, MILLIS_ERROR_MARGIN), 'initial sync');
    return [200, splitChangesMock1];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'treatment value of initial Split');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SSE_OPEN, MILLIS_ERROR_MARGIN), 'sync due to success SSE connection');
    return [200, splitChangesMock2];
  });
  mock.onGet(settings.url('/splitChanges?since=1457552620999')).replyOnce(function () {
    assert.equal(client.getTreatment(key, 'whitelist'), 'not_allowed', 'treatment value of initial Split');
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_FIRST_SPLIT_UPDATE_EVENT, MILLIS_ERROR_MARGIN), 'sync due to first SPLIT_UPDATE event');
    return [200, splitChangesMock3];
  });

}