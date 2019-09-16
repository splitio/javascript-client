import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';

// mocks for mySegments readiness tests
import splitChangesStartWithoutSegmentsMock from '../mocks/splitchanges.real.json';
import splitChangesUpdateWithSegmentsMock from '../mocks/splitchanges.real.updateWithSegments.json';
import splitChangesUpdateWithoutSegmentsMock from '../mocks/splitchanges.real.updateWithoutSegments.json';
import splitChangesStartWithSegmentsMock from '../mocks/splitchanges.real.withSegments.json';

const baseConfig = {
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
  }
};

export default function(mock, assert) {
  assert.test(t => { // Timeout test, we have retries but splitChanges takes too long
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessSuite1',
      events: 'https://events.baseurl/readinessSuite1'
    };
    mock
      .onGet(testUrls.sdk + '/splitChanges?since=-1').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 5100); });
      })
      .onGet(testUrls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 4900); });
      })
      .onGet(testUrls.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesMock2);

    const splitio = SplitFactory({
      ...baseConfig, urls: testUrls
    });
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
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessSuite2',
      events: 'https://events.baseurl/readinessSuite2'
    };
    mock
      .onGet(testUrls.sdk + '/splitChanges?since=-1').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 4900); });
      })
      .onGet(testUrls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 5100); });
      })
      .onGet(testUrls.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesMock2);

    const splitio = SplitFactory({ ...baseConfig, urls: testUrls });
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
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessSuite3',
      events: 'https://events.baseurl/readinessSuite3'
    };

    mock
      .onGet(testUrls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 5100); });
      })
      .onGet(testUrls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, 4900); }); // Faster, it should get ready on the retry.
      })
      .onGet(testUrls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, 4900); });
      })
      .onGet(testUrls.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesMock2);

    const splitio = SplitFactory({ ...baseConfig, urls: testUrls });
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

  /************** Now we will validate the intelligent mySegments pausing, which requires lots of code. Related code below. **************/
  localStorage.clear();
  const mySegmentsEndpointDelay = 450;
  function mockForSegmentsPauseTest(testUrls, startWithSegments = false) {
    let mySegmentsHits = 0;

    mock
      .onGet(new RegExp(`${testUrls.sdk}/mySegments/nicolas\\d?@split.io`)).reply(function() { // Mock any mySegments call, so we can test with multiple clients.
        mySegmentsHits++;
        return new Promise((res) => { setTimeout(() => { res([200, { mySegments: [] }, {}]); }, mySegmentsEndpointDelay); });
      }) 
      // Now mock the no more updates state 
      .onGet(testUrls.sdk + '/splitChanges?since=1457552669999').reply(200, { splits: [], since: 1457552669999, till: 1457552669999 });


    if (startWithSegments) {
      // Adjust since and till so the order is inverted.
      mock.onGet(testUrls.sdk + '/splitChanges?since=-1').reply(200, splitChangesStartWithSegmentsMock)
        .onGet(testUrls.sdk + '/splitChanges?since=1457552620999').reply(200, { ...splitChangesUpdateWithoutSegmentsMock, since: 1457552620999, till: 1457552649999 })
        .onGet(testUrls.sdk + '/splitChanges?since=1457552649999').reply(200, { ...splitChangesUpdateWithSegmentsMock, since: 1457552649999, till: 1457552669999 });
    } else {
      mock.onGet(testUrls.sdk + '/splitChanges?since=-1').reply(200, splitChangesStartWithoutSegmentsMock)
        .onGet(testUrls.sdk + '/splitChanges?since=1457552620999').reply(200, splitChangesUpdateWithSegmentsMock)
        .onGet(testUrls.sdk + '/splitChanges?since=1457552649999').reply(200, splitChangesUpdateWithoutSegmentsMock);
    }

    return () => mySegmentsHits;
  }

  assert.test(t => { // Testing how the SDK pauses/resumes segments synchronization.
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessMySegmentsSuite',
      events: 'https://events.baseurl/readinessMySegmentsSuite'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, false);

    const start = Date.now();
    const splitio = SplitFactory({ 
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start < 50, 'It should be ready really quickly, without waiting for mySegments, as there were no segments in the first splits payload.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 1 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt, but it stopped syncing afterwards.');
      }, 2500);
      // Now we will wait until it picks up Splits, using the SDK_UPDATE event. Features are refreshed every 3s, but segments every 1s. 
      client.once(client.Event.SDK_UPDATE, () => {
        // This update came with segments, it should have tried to fetch mySegments for all used keys.
        setTimeout(() => {
          t.equal(getMySegmentsHits(), 2 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments as soon as it received a new Split with segments.');
        }, 0);

        setTimeout(() => { // Nasty ugly crap to avoid listening to the update coming from mySegment calls.
          client.once(client.Event.SDK_UPDATE, () => {
            setTimeout(() => {            
              // This update left us in an state with no segments (removed the matcher we fetched on the previous one), it should stop the producer and not trigger more requests.
              t.equal(getMySegmentsHits(), 4 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments periodically.');
  
              setTimeout(() => {
                t.equal(getMySegmentsHits(), 4 * CLIENTS_COUNT, 'It should have not tried to synchronize segments again after the last update that left us in a no segment state.');
  
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

  assert.test(t => { // Testing how the SDK pauses/resumes segments synchronization in localstorage.
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessLSMySegmentsSuite',
      events: 'https://events.baseurl/readinessLSMySegmentsSuite'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, false);

    const start = Date.now();
    const splitio = SplitFactory({ 
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'not_using_segments'
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start < 50, 'It should be ready really quickly, without waiting for mySegments, as there were no segments in the first splits payload.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 1 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt, but it stopped syncing afterwards.');
      }, 2500);
      // Now we will wait until it picks up Splits, using the SDK_UPDATE event. Features are refreshed every 3s, but segments every 1s. 
      client.once(client.Event.SDK_UPDATE, () => {
        // This update came with segments, it should have tried to fetch mySegments for all used keys.
        setTimeout(() => {
          t.equal(getMySegmentsHits(), 2 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments as soon as it received a new Split with segments.');
        }, 0);

        setTimeout(() => { // Nasty ugly crap to avoid listening to the update coming from mySegment calls.
          client.once(client.Event.SDK_UPDATE, () => {
            setTimeout(() => {
              // This update left us in an state with no segments (removed the matcher we fetched on the previous one), it should stop the producer and not trigger more requests.
              t.equal(getMySegmentsHits(), 4 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments periodically.');
  
              setTimeout(() => {
                t.equal(getMySegmentsHits(), 4 * CLIENTS_COUNT, 'It should have not tried to synchronize segments again after the last update that left us in a no segment state.');
  
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
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessMySegmentsSuite2',
      events: 'https://events.baseurl/readinessMySegmentsSuite2'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, true);

    const start = Date.now();
    const splitio = SplitFactory({
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start >= mySegmentsEndpointDelay, 'It should not be ready without waiting for mySegments, as there are segments in the first splits payload.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 3 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt and keep syncing afterwards.');
      }, 2500);
      // Now we will wait until it picks up splits, using the SDK_UPDATE event. Features are refreshed every 3s, but segments every 1s (plus sync time). 
      client.once(client.Event.SDK_UPDATE, () => {
        // This update came without segments, it should not trigger an extra fetch.
        setTimeout(() => {
          t.equal(getMySegmentsHits(), 3 * CLIENTS_COUNT, 'It should have stopped synchronizing mySegments since it transitioned to no segments state.');
        }, 0);

        setTimeout(() => {
          client.once(client.Event.SDK_UPDATE, () => {
            setTimeout(() => {            
              // This update left us in an state with segments again, it should trigger a request ASAP and restart the producer.
              t.equal(getMySegmentsHits(), 4 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments periodically.');
  
              setTimeout(() => {
                t.equal(getMySegmentsHits(), 6 * CLIENTS_COUNT, 'It should keep the producer synchronizing periodically..');
  
                Promise.all([
                  client2.destroy(),
                  client3.destroy(),
                  client.destroy()
                ]).then(() => { t.end(); });
                
              }, 3000);
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

  assert.test(t => { // Testing when we start from scratch
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessLSMySegmentsSuite2',
      events: 'https://events.baseurl/readinessLSMySegmentsSuite2'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, true);

    const start = Date.now();
    const splitio = SplitFactory({
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'using_segments'
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start >= mySegmentsEndpointDelay, 'It should not be ready without waiting for mySegments, as there are segments in the first splits payload.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 3 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt and keep syncing afterwards.');
      }, 2500);
      // Now we will wait until it picks up splits, using the SDK_UPDATE event. Features are refreshed every 3s, but segments every 1s (plus sync time). 
      client.once(client.Event.SDK_UPDATE, () => {
        // This update came without segments, it should not trigger an extra fetch.
        setTimeout(() => {
          t.equal(getMySegmentsHits(), 3 * CLIENTS_COUNT, 'It should have stopped synchronizing mySegments since it transitioned to no segments state.');
        }, 0);

        setTimeout(() => {
          client.once(client.Event.SDK_UPDATE, () => {
            setTimeout(() => {            
              // This update left us in an state with segments again, it should trigger a request ASAP and restart the producer.
              t.equal(getMySegmentsHits(), 4 * CLIENTS_COUNT, 'It should have tried to synchronize mySegments periodically.');
  
              setTimeout(() => {
                t.equal(getMySegmentsHits(), 6 * CLIENTS_COUNT, 'It should keep the producer synchronizing periodically..');
  
                Promise.all([
                  client2.destroy(),
                  client3.destroy(),
                  client.destroy()
                ]).then(() => { t.end(); });
                
              }, 3000);
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

  assert.test(t => { // Testing when we start from scratch with segments being previously used
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessLSMySegmentsSuite3',
      events: 'https://events.baseurl/readinessLSMySegmentsSuite3'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, true);

    const start = Date.now();
    const splitio = SplitFactory({
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'using_segments'
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start >= mySegmentsEndpointDelay, 'It should not be ready without waiting for mySegments, when we start from cache it might be stale.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 3 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt and keep syncing afterwards.');
        Promise.all([
          client2.destroy(),
          client3.destroy(),
          client.destroy()
        ]).then(() => { t.end(); });
      }, 2500);
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('### SDK TIMED OUT - It should not timeout in this scenario as segments were not necessary.');
      t.end();
    });
  });

  assert.test(t => { // Testing when we start from cache without segments being previously used, and first update has no segments.
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessLSMySegmentsSuite4',
      events: 'https://events.baseurl/readinessLSMySegmentsSuite4'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, false);

    const start = Date.now();
    const splitio = SplitFactory({
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'not_using_segments'
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start < 50, 'It should be ready quickly, since it had no segments and update has no segments either.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 1 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt but stopped syncing afterwards');
        Promise.all([
          client2.destroy(),
          client3.destroy(),
          client.destroy()
        ]).then(() => { t.end(); });
      }, 4500);
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('### SDK TIMED OUT - It should not timeout in this scenario as segments were not necessary.');
      t.end();
    });
  });

  assert.test(t => { // Testing when we start from cache without segments being previously used, and first update HAS segments.
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessLSMySegmentsSuite4',
      events: 'https://events.baseurl/readinessLSMySegmentsSuite4'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, false);

    // I'm having the first update of Splits come with segments. In this scenario it'll wait for mySegments to download before being ready.
    mock.onGet(testUrls.sdk + '/splitChanges?since=1457552669999').reply(200, { ...splitChangesUpdateWithSegmentsMock, since: 1457552669999, till: 1457552679999 })
      .onGet(testUrls.sdk + '/splitChanges?since=1457552679999').reply(200, { splits: [], since: 1457552679999, till: 1457552679999 });

    const start = Date.now();
    const splitio = SplitFactory({
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'not_using_segments'
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start >= mySegmentsEndpointDelay, 'It should not be ready without waiting for mySegments, when we start from cache it might be stale.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 3 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt but stopped syncing afterwards');
        Promise.all([
          client2.destroy(),
          client3.destroy(),
          client.destroy()
        ]).then(() => { t.end(); });
      }, 3000);
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('### SDK TIMED OUT - It should not timeout in this scenario as segments were not necessary.');
      t.end();
    });
  });

  assert.test(t => { // Testing when we start from cache with segments being previously used, and update is empty.
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessLSMySegmentsSuite5',
      events: 'https://events.baseurl/readinessLSMySegmentsSuite5'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, false);

    const start = Date.now();
    const splitio = SplitFactory({
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'using_segments'
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start >= mySegmentsEndpointDelay, 'It should not be ready without waiting for mySegments, when we start from cache it might be stale and we had segments even though the update has nothing.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 3 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt and kept syncing afterwards');
        Promise.all([
          client2.destroy(),
          client3.destroy(),
          client.destroy()
        ]).then(() => { t.end(); });
      }, 3000);
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('### SDK TIMED OUT - It should not timeout in this scenario as segments were not necessary.');
      t.end();
    });
  });

  assert.test(t => { // Testing when we start from cache with segments being previously used and first update removes segments
    const testUrls = {
      sdk: 'https://sdk.baseurl/readinessLSMySegmentsSuite5',
      events: 'https://events.baseurl/readinessLSMySegmentsSuite5'
    };
    const getMySegmentsHits = mockForSegmentsPauseTest(testUrls, false);
    // I'm having the first update of Splits come without segments. In this scenario it'll NOT wait for mySegments to download before being ready.
    mock.onGet(testUrls.sdk + '/splitChanges?since=1457552669999').reply(200, { ...splitChangesUpdateWithoutSegmentsMock, since: 1457552669999, till: 1457552679999 })
      .onGet(testUrls.sdk + '/splitChanges?since=1457552679999').reply(200, { splits: [], since: 1457552679999, till: 1457552679999 });

    const start = Date.now();
    const splitio = SplitFactory({
      ...baseConfig, 
      startup: {
        retriesOnFailureBeforeReady: 0
      },
      scheduler: {
        featuresRefreshRate: 3.1,
        segmentsRefreshRate: 1,
        metricsRefreshRate: 3000,
        impressionsRefreshRate: 3000
      },
      storage: {
        type: 'LOCALSTORAGE',
        prefix: 'using_segments'
      },
      urls: testUrls
    });
    const CLIENTS_COUNT = 3; // Just so it's easier to read the assertions.
    const client = splitio.client();
    const client2 = splitio.client('nicolas2@split.io');
    const client3 = splitio.client('nicolas3@split.io');

    client.once(client.Event.SDK_READY, () => {
      t.ok(Date.now() - start < 50, 'It should be ready without waiting for mySegments, since when it downloads changes it will have no more use for them.');

      setTimeout(() => {
        t.equal(getMySegmentsHits(), 1 * CLIENTS_COUNT, 'mySegments should had been hit once per client on the first attempt and stopped syncing afterwards');
        Promise.all([
          client2.destroy(),
          client3.destroy(),
          client.destroy()
        ]).then(() => { t.end(); });
      }, 3000);
    });
    client.once(client.Event.SDK_READY_TIMED_OUT, () => {
      t.fail('### SDK TIMED OUT - It should not timeout in this scenario as segments were not necessary.');
      t.end();
    });
  });
}
