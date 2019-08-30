import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';

// mocks for mySegments readiness tests
import splitChangesRealMock from '../mocks/splitchanges.real.json';
import splitChangesRealWithSegmentsMock from '../mocks/splitchanges.real.updateWithSegments.json';
import splitChangesRealWithoutSegmentsMock from '../mocks/splitchanges.real.updateWithoutSegments.json';

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
const baseUrlsMySegments = {
  sdk: 'https://sdk.baseurl/readinessMySegmentsSuite',
  events: 'https://events.baseurl/readinessMySegmentsSuite'
};
const baseUrlsLSMySegments = {
  sdk: 'https://sdk.baseurl/readinessLSMySegmentsSuite',
  events: 'https://events.baseurl/readinessLSMySegmentsSuite'
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
  assert.test(t => { // Timeout test, we have retries but splitChanges takes too long
    mock
      .onGet(baseUrls1.sdk + '/splitChanges?since=-1').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 5100); });
      })
      .onGet(baseUrls1.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 4900); });
      })
      .onGet(baseUrls1.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesMock2);

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
    mock
      .onGet(baseUrls2.sdk + '/splitChanges?since=-1').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 4900); });
      })
      .onGet(baseUrls2.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 5100); });
      })
      .onGet(baseUrls2.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesMock2);

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

    const splitio = SplitFactory({ ...config, urls: baseUrls3 });
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

  assert.test(t => { // Testing how the SDK pauses/resumes segments synchronization.
    let mySegmentsHits = 0;
  
    mock
      .onGet(baseUrlsMySegments.sdk + '/splitChanges?since=-1').reply(200, splitChangesRealMock)
      .onGet(baseUrlsMySegments.sdk + '/mySegments/nicolas@split.io').reply(function() {
        mySegmentsHits++;
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 450); });
      })
      .onGet(baseUrlsMySegments.sdk + '/mySegments/nicolas2@split.io').reply(function() {
        mySegmentsHits++;
        return new Promise((res) => { setTimeout(() => { res([200, { mySegments: [] }, {}]); }, 450); });
      })
      .onGet(baseUrlsMySegments.sdk + '/mySegments/nicolas3@split.io').reply(function() {
        mySegmentsHits++;
        return new Promise((res) => { setTimeout(() => { res([200, { mySegments: [] }, {}]); }, 450); });
      })
      .onGet(baseUrlsMySegments.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesRealWithSegmentsMock)
      .onGet(baseUrlsMySegments.sdk + '/splitChanges?since=1457552649999').reply(200, splitChangesRealWithoutSegmentsMock)
      .onGet(baseUrlsMySegments.sdk + '/splitChanges?since=1457552669999').reply(200, { splits: [], since: 1457552669999, till: 1457552669999 });

    const start = Date.now();
    const splitio = SplitFactory({ 
      ...config, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      urls: baseUrlsMySegments
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start < 50, 'It should be ready really quickly, without waiting for mySegments, as there were no segments in the first splits payload.');

      setTimeout(() => {
        //@TODO: Finish with a shared client.
        t.equal(mySegmentsHits, 1 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt, but it stopped syncing afterwards.');
      }, 2500);
      // Now we will wait until it picks up Splits, using the SDK_UPDATE event. Features are refreshed every 3s, but segments every 1s. 
      client.once(client.Event.SDK_UPDATE, () => {
        // This update came with segments, it should have tried to fetch mySegments for all used keys.
        setTimeout(() => {
          t.equal(mySegmentsHits, 2 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments as soon as it received a new Split with segments.');
        }, 0);

        setTimeout(() => { // Nasty ugly crap to avoid listening to the update coming from mySegment calls.
          client.once(client.Event.SDK_UPDATE, () => {
            setTimeout(() => {            
              // This update left us in an state with no segments (removed the matcher we fetched on the previous one), it should stop the producer and not trigger more requests.
              t.equal(mySegmentsHits, 4 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments periodically.');
  
              setTimeout(() => {
                t.equal(mySegmentsHits, 4 * CLIENTS_COUNT, 'It should have not tried to synchronize segments again after the last update that left us in a no segment state.');
  
                Promise.all([
                  client2.destroy(),
                  client3.destroy(),
                  client.destroy()
                ]).then(() => { t.end(); });
                
              }, 10000);
            }, 0);
          });
        }, 3000); 
      });
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('### SDK TIMED OUT - It should not timeout in this scenario as segments were not necessary.');
      t.end();
    });
  });

  assert.test(t => { // Testing how the SDK pauses/resumes segments synchronization.
    let mySegmentsHits = 0;
  
    mock
      .onGet(baseUrlsLSMySegments.sdk + '/splitChanges?since=-1').reply(200, splitChangesRealMock)
      .onGet(baseUrlsLSMySegments.sdk + '/mySegments/nicolas@split.io').reply(function() {
        mySegmentsHits++;
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 450); });
      })
      .onGet(baseUrlsLSMySegments.sdk + '/mySegments/nicolas2@split.io').reply(function() {
        mySegmentsHits++;
        return new Promise((res) => { setTimeout(() => { res([200, { mySegments: [] }, {}]); }, 450); });
      })
      .onGet(baseUrlsLSMySegments.sdk + '/mySegments/nicolas3@split.io').reply(function() {
        mySegmentsHits++;
        return new Promise((res) => { setTimeout(() => { res([200, { mySegments: [] }, {}]); }, 450); });
      })
      .onGet(baseUrlsLSMySegments.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesRealWithSegmentsMock)
      .onGet(baseUrlsLSMySegments.sdk + '/splitChanges?since=1457552649999').reply(200, splitChangesRealWithoutSegmentsMock)
      .onGet(baseUrlsLSMySegments.sdk + '/splitChanges?since=1457552669999').reply(200, { splits: [], since: 1457552669999, till: 1457552669999 });

    const start = Date.now();
    const splitio = SplitFactory({ 
      ...config, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      storaeg: {
        type: 'LOCALSTORAGE'
      },
      urls: baseUrlsLSMySegments
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start < 50, 'It should be ready really quickly, without waiting for mySegments, as there were no segments in the first splits payload.');

      setTimeout(() => {
        //@TODO: Finish with a shared client.
        t.equal(mySegmentsHits, 1 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt, but it stopped syncing afterwards.');
      }, 2500);
      // Now we will wait until it picks up Splits, using the SDK_UPDATE event. Features are refreshed every 3s, but segments every 1s. 
      client.once(client.Event.SDK_UPDATE, () => {
        // This update came with segments, it should have tried to fetch mySegments for all used keys.
        setTimeout(() => {
          t.equal(mySegmentsHits, 2 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments as soon as it received a new Split with segments.');
        }, 0);

        setTimeout(() => { // Nasty ugly crap to avoid listening to the update coming from mySegment calls.
          client.once(client.Event.SDK_UPDATE, () => {
            setTimeout(() => {            
              // This update left us in an state with no segments (removed the matcher we fetched on the previous one), it should stop the producer and not trigger more requests.
              t.equal(mySegmentsHits, 4 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments periodically.');
  
              setTimeout(() => {
                t.equal(mySegmentsHits, 4 * CLIENTS_COUNT, 'It should have not tried to synchronize segments again after the last update that left us in a no segment state.');
  
                Promise.all([
                  client2.destroy(),
                  client3.destroy(),
                  client.destroy()
                ]).then(() => { t.end(); });
                
              }, 10000);
            }, 0);
          });
        }, 3000); 
      });
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('### SDK TIMED OUT - It should not timeout in this scenario as segments were not necessary.');
      t.end();
    });
  });

}
