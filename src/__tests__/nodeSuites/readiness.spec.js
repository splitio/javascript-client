import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';

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

}
