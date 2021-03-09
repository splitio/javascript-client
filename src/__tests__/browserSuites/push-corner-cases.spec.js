import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitKillMessage from '../mocks/message.SPLIT_KILL.1457552650000.json';
import authPushEnabledNicolas from '../mocks/auth.pushEnabled.nicolas@split.io.json';
import { nearlyEqual } from '../testUtils';

// Replace original EventSource with mock
import EventSourceMock, { setMockListener } from '../../sync/__tests__/mocks/eventSourceMock';
window.EventSource = EventSourceMock;

import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

const userKey = 'nicolas@split.io';

const baseUrls = {
  sdk: 'https://sdk.push-corner-cases/api',
  events: 'https://events.push-corner-cases/api',
  auth: 'https://auth.push-corner-cases/api'
};
const config = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: userKey
  },
  urls: baseUrls,
  storage: {
    type: 'LOCALSTORAGE',
    prefix: 'pushCornerCase'
  },
};
const settings = SettingsFactory(config);

const MILLIS_SSE_OPEN = 100;
const MILLIS_SPLIT_KILL_EVENT = 200;
const MILLIS_SPLIT_CHANGES_RESPONSE = 400;

/**
 * Sequence of calls:
 *  0.0 secs: initial SyncAll (/splitChanges, /mySegments/*), auth, SSE connection, SDK_READY_FROM_CACHE
 *  0.1 secs: SSE connection opened -> syncAll (/splitChanges, /mySegments/*)
 *  0.2 secs: SPLIT_KILL event -> /splitChanges
 *  0.4 secs: /splitChanges response --> SDK_READY
 */
export function testSplitKillOnReadyFromCache(fetchMock, assert) {
  assert.plan(2);
  fetchMock.reset();

  // prepare localstorage to allow SPLIT_KILL kill locally
  localStorage.clear();
  localStorage.setItem('pushCornerCase.SPLITIO.splits.till', 25);
  localStorage.setItem('pushCornerCase.SPLITIO.split.whitelist', JSON.stringify({
    'name': 'whitelist',
    'status': 'ACTIVE',
    'killed': false,
    'defaultTreatment': 'not_allowed',
  }));

  let start, splitio, client;

  // mock SSE open and message events
  setMockListener(function (eventSourceInstance) {
    setTimeout(() => {
      eventSourceInstance.emitOpen();
    }, MILLIS_SSE_OPEN); // open SSE connection after 0.1 seconds

    setTimeout(() => {
      eventSourceInstance.emitMessage(splitKillMessage);
    }, MILLIS_SPLIT_KILL_EVENT); // send a SPLIT_KILL event with a new changeNumber after 0.2 seconds
  });

  // 1 auth request
  fetchMock.getOnce(settings.url(`/auth?users=${encodeURIComponent(userKey)}`), { status: 200, body: authPushEnabledNicolas });
  // 2 mySegments requests: initial sync and after SSE opened
  fetchMock.get({ url: settings.url('/mySegments/nicolas%40split.io'), repeat: 2 }, { status: 200, body: { mySegments: [] } });

  // 2 splitChanges request: initial sync and after SSE opened. Sync after SPLIT_KILL is not performed because SplitsSyncTask is "executing"
  fetchMock.getOnce(settings.url('/splitChanges?since=25'), { status: 200, body: splitChangesMock1}, {delay: MILLIS_SPLIT_CHANGES_RESPONSE, /* delay response */ });
  fetchMock.getOnce(settings.url('/splitChanges?since=25'), { status: 200, body: splitChangesMock1}, {delay: MILLIS_SPLIT_CHANGES_RESPONSE - 100, /* delay response */ });

  fetchMock.get(new RegExp('.*'), function (url) {
    assert.fail('unexpected GET request with url: ' + url);
  });

  fetchMock.post('*', 200);

  start = Date.now();
  splitio = SplitFactory(config);
  client = splitio.client();
  client.on(client.Event.SDK_UPDATE, () => {
    assert.fail('SDK_UPDATE must no be emitted, even after SPLIT_KILL has changed the cached data');
  });
  client.on(client.Event.SDK_READY_FROM_CACHE, () => {
    assert.pass();
  });
  client.on(client.Event.SDK_READY, () => {
    const lapse = Date.now() - start;
    assert.true(nearlyEqual(lapse, MILLIS_SPLIT_CHANGES_RESPONSE), 'SDK_READY once split changes arrives');

    client.destroy().then(()=> { assert.end();});
  });
}