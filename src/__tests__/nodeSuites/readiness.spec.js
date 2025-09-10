import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import { alwaysOnSplitInverted } from '../browserSuites/ready-from-cache.spec';

const readyTimeout = 0.1;

const baseConfig = {
  core: {
    authorizationKey: '<fake-token>',
  },
  startup: {
    readyTimeout,
  },
  streamingEnabled: false
};

export default function (fetchMock, assert) {

  assert.test(t => { // Timeout test: we provide a client-side SDK key on server-side (403 error)
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessSuite1',
      events: 'https://events.baseurl/readinessSuite1'
    };

    fetchMock.getOnce(testUrls.sdk + '/splitChanges?s=1.3&since=-1&rbSince=-1', { status: 200, body: splitChangesMock1 });
    fetchMock.getOnce(testUrls.sdk + '/splitChanges?s=1.3&since=1457552620999&rbSince=-1', { status: 200, body: splitChangesMock2 });
    fetchMock.get(new RegExp(testUrls.sdk + '/segmentChanges/*'), 403);
    fetchMock.postOnce(testUrls.events + '/events/bulk', 200);

    const splitio = SplitFactory({
      ...baseConfig, urls: testUrls
    });
    const client = splitio.client();

    t.true(client.track('some_key', 'some_tt', 'some_event_type'), 'since client is not destroyed, client.track returns true');

    client.once(client.Event.SDK_READY, () => {
      t.fail('### IS READY - NOT TIMED OUT when it should.');
      t.end();
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, async () => {
      t.pass('### SDK TIMED OUT - SegmentChanges requests with client-side SDK key should fail with 403. Timed out.');

      t.false(client.track('some_key', 'some_tt', 'some_event_type'), 'since client is flagged as destroyed, client.track returns false');
      t.equal(client.getTreatment('hierarchical_splits_test'), 'control', 'since client is flagged as destroyed, client.getTreatment returns control');

      // ready promise should reject
      try {
        await client.ready();
      } catch (e) {
        await splitio.destroy();
        t.end();
      }
    });
  });

  assert.test(t => { // Testing when we start with initial rollout plan data (is ready from cache immediately)
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessSuite2',
      events: 'https://events.baseurl/readinessSuite2'
    };

    fetchMock.getOnce(testUrls.sdk + '/splitChanges?s=1.3&since=25&rbSince=-1', { status: 200, body: { ff: { ...splitChangesMock1.ff, s: 25 } } });
    fetchMock.getOnce(testUrls.sdk + '/segmentChanges/employees?since=100', { status: 200, body: { name: 'employees', added: [], removed: [], since: 100, till: 100 } });
    fetchMock.getOnce(testUrls.sdk + '/segmentChanges/splitters?since=-1', { status: 200, body: { name: 'splitters', added: [], removed: [], since: -1, till: 100 } });
    fetchMock.getOnce(testUrls.sdk + '/segmentChanges/splitters?since=100', { status: 200, body: { name: 'splitters', added: [], removed: [], since: 100, till: 100 } });
    fetchMock.getOnce(testUrls.sdk + '/segmentChanges/developers?since=-1', { status: 200, body: { name: 'developers', added: [], removed: [], since: -1, till: 100 } });
    fetchMock.getOnce(testUrls.sdk + '/segmentChanges/developers?since=100', { status: 200, body: { name: 'developers', added: [], removed: [], since: 100, till: 100 } });
    fetchMock.postOnce(testUrls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(testUrls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory({
      ...baseConfig,
      urls: testUrls,
      initialRolloutPlan: {
        splitChanges: {
          ff: {
            t: 25,
            d: [JSON.parse(alwaysOnSplitInverted)]
          }
        },
        segmentChanges: [{
          name: 'employees', added: ['emi@split.io'], removed: [], till: 100
        }]
      }
    });

    const client = splitio.client();

    t.equal(client.__getStatus().isReadyFromCache, true, 'Client is ready from cache');

    t.equal(client.getTreatment('nicolas@split.io', 'always_on'), 'off', 'It should evaluate treatments with data from cache. Key not in segment');
    t.equal(client.getTreatment('emi@split.io', 'always_on'), 'on', 'It should evaluate treatments with data from cache. Key in segment');

    client.on(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('It should not timeout in this scenario.');
      t.end();
    });

    client.on(client.Event.SDK_READY_FROM_CACHE, () => {
      t.fail('SDK is ready from cache immediately. SDK_READY_FROM_CACHE not emitted.');
      t.end();
    });

    client.on(client.Event.SDK_READY, () => {
      t.equal(client.getTreatment('nicolas@split.io', 'always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');
      t.equal(client.getTreatment('emi@split.io', 'always_on'), 'on', 'It should evaluate treatments with updated data after syncing with the cloud.');

      splitio.destroy().then(() => {
        t.end();
      });
    });
  });

}
