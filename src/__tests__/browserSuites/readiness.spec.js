import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';

const baseUrls1 = {
  sdk: 'https://sdk.baseurl/readinessSuite1',
  events: 'https://events.baseurl/readinessSuite1'
};
const baseUrls2 = {
  sdk: 'https://sdk.baseurl/readinessSuite2',
  events: 'https://events.baseurl/readinessSuite2'
};
const baseUrls3 = {
  sdk: 'https://sdk.baseurl/readinessSuite3',
  events: 'https://events.baseurl/readinessSuite3'
};

const config = {
  core: {
    authorizationKey: '<fake-token-3>',
    key: 'nicolas@split.io'
  },
  scheduler: {
    featuresRefreshRate: 3000,
    segmentsRefreshRate: 3000,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  startup: {
    eventsFirstPushWindow: 3000 // We use default for the readiness related ones.
  },
  urls: baseUrls1
};

export default function(mock, assert) {
  // Mocking this specific routes to add delay to the responses.
  // Timed out because of splitChanges
  mock
    .onGet(baseUrls1.sdk + '/splitChanges?since=-1').reply(function() {
      return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 5100); });
    })
    .onGet(baseUrls1.sdk + '/mySegments/nicolas@split.io').reply(function() {
      return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 4900); });
    })
    .onGet(baseUrls1.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesMock2);
  
  // Timed out because of mySegments
  mock
    .onGet(baseUrls2.sdk + '/splitChanges?since=-1').reply(function() {
      return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 4900); });
    })
    .onGet(baseUrls2.sdk + '/mySegments/nicolas@split.io').reply(function() {
      return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 5100); });
    })
    .onGet(baseUrls2.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesMock2);
  
  // For test that'll get ready
  mock
    .onGet(baseUrls3.sdk + '/splitChanges?since=-1').replyOnce(function() {
      return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 5100); });
    })
    .onGet(baseUrls3.sdk + '/splitChanges?since=-1').replyOnce(function() {
      return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 4900); }); // Faster, it should get ready on the retry.
    })
    .onGet(baseUrls3.sdk + '/mySegments/nicolas@split.io').reply(function() {
      return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 4900); });
    })
    .onGet(baseUrls3.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesMock2);
  /** END endpoint mocking **/

  assert.test(t => { // Timeout test, we have retries but splitChanges takes too long
    const splitio = SplitFactory(config);
    const client = splitio.client();
  
    client.once(client.Event.SDK_READY, () => {
      t.fail('### IS READY - NOT TIMED OUT when it should.');
      t.end();
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');

      client.destroy().then(() => { t.end(); });
    });
  });

  assert.test(t => { // Timeout test, we have retries but mySegmnets takes too long
    const splitio = SplitFactory({ ...config, urls: baseUrls2 });
    const client = splitio.client();
  
    client.once(client.Event.SDK_READY, () => {
      t.fail('### IS READY - NOT TIMED OUT when it should.');
      t.end();
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');

      client.destroy().then(() => { t.end(); });
    });
  });
  
  assert.test(t => { // Readiness test, first splitChanges above the limit (req timeout) second one below so final state should be ready.
    const splitio = SplitFactory({ ...config, urls: baseUrls3, debug: true });
    const client = splitio.client();

    client.once(client.Event.SDK_READY, () => {
      t.pass('### SDK IS READY as it should, both requests are under the limits');
      client.destroy().then(() => { t.end(); });
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('### SDK TIMED OUT - It should not in this scenario');
      t.end();
    });
  });
}
