import { SplitFactory } from '../..';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsNicolas from '../mocks/mysegments.nicolas@split.io.json';

const baseConfig = {
  core: {
    authorizationKey: '<fake-token-3>',
    key: 'nicolas@split.io'
  }
};

export default function readyPromiseAssertions(mock, assert) {

  // Basic time out path: startup without retries on failure and response taking more than 'requestTimeoutBeforeReady'.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite1',
        events: 'https://events.baseurl/readinessSuite1'
      },
      scheduler: {
        featuresRefreshRate: 3000,
        segmentsRefreshRate: 3000,
      },
      startup: {
        readyTimeout: 2, // We use a short ready timeout to don't extend to much the test
        requestTimeoutBeforeReady: 1,
        retriesOnFailureBeforeReady: 0
      }
    };
    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      }) // /splitChanges takes longer than 'requestTimeoutBeforeReady'
      .onGet(config.urls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
        client.destroy().then(() => { t.end(); });
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Request tooks longer than we allowed per requestTimeoutBeforeReady, timed out.');
        client.destroy().then(()=>{
          client.ready()
            .then(() => {
              t.fail('### SDK IS READY - It should not in this scenario.');
              t.end();
            })
            .catch(() => {
              t.pass('### SDK TIME OUT - the promise remains rejected after client destruction.');
              t.end();
            });
        });
      });
  }, 'Basic "time out" test. We have no retries and response take longer than we allowed per requestTimeoutBeforeReady');

  // Basic is ready path: startup without retries on failure and response taking less than 'requestTimeoutBeforeReady'.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite2',
        events: 'https://events.baseurl/readinessSuite2'
      },
      scheduler: {
        featuresRefreshRate: 3000,
        segmentsRefreshRate: 3000,
      },
      startup: {
        readyTimeout: 2,
        requestTimeoutBeforeReady: 1,
        retriesOnFailureBeforeReady: 0
      }
    };
    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      })
      .onGet(config.urls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      }); // Both /splitChanges and /mySegments take less than 'requestTimeoutBeforeReady'

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.pass('### SDK IS READY as it should, request is under the limits.');
        client.destroy().then(()=>{
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
              t.end();
            })
            .catch(() => {
              t.fail('### SDK TIMED OUT - It should not in this scenario.');
              t.end();
            });
        });
      })
      .catch(() => {
        t.fail('### SDK TIMED OUT - It should not in this scenario');
      });
  }, 'Basic "is ready" test: we have retries but splitChanges takes too long');

  // Timeout with retry attempt. Timeout is triggered even when it is longer than the request time, since the first and retry requests take more than the limit.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite3',
        events: 'https://events.baseurl/readinessSuite3'
      },
      scheduler: {
        featuresRefreshRate: 3000,
        segmentsRefreshRate: 3000,
      },
      startup: {
        readyTimeout: 3,
        requestTimeoutBeforeReady: 1,
        retriesOnFailureBeforeReady: 1
      }
    };
    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      })
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      })
      .onGet(config.urls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');
        client.destroy().then(()=>{
          client.ready()
            .then(() => {
              t.fail('### SDK IS READY - It should not in this scenario.');
              t.end();
            })
            .catch(() => {
              t.pass('### SDK IS READY - the promise remains rejected after client destruction.');
              t.end();
            });
        });
      });
  }, 'Timeout with a retry attempt');

  // Ready with retry attempt. The retry attempt is below the limit.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite4',
        events: 'https://events.baseurl/readinessSuite4'
      },
      scheduler: {
        featuresRefreshRate: 3000,
        segmentsRefreshRate: 3000,
      },
      startup: {
        readyTimeout: 3,
        requestTimeoutBeforeReady: 1,
        retriesOnFailureBeforeReady: 1
      }
    };
    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      })
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      })
      .onGet(config.urls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.pass('### SDK IS READY - the retry request is under the limits.');
        client.destroy().then(()=>{
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
              t.end();
            })
            .catch(() => {
              t.fail('### SDK TIMED OUT - It should not in this scenario.');
              t.end();
            });
        });
      })
      .catch(() => {
        t.fail('### SDK TIMED OUT - It should not in this scenario');
      });
  }, 'Ready with retry attempt. The retry attempt is below the limit.');

  // Time out and then ready after retry attempt. Time out is triggered, but the retry attempt is below the limit.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite5',
        events: 'https://events.baseurl/readinessSuite5'
      },
      scheduler: {
        featuresRefreshRate: 3000,
        segmentsRefreshRate: 3000,
      },
      startup: {
        readyTimeout: 3,
        requestTimeoutBeforeReady: 2,
        retriesOnFailureBeforeReady: 1
      }
    };
    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      })
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      })
      .onGet(config.urls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - time out is triggered before retry attempt finishes');
        setTimeout(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - retry attempt finishes before the requestTimeoutBeforeReady limit');
              client.destroy().then(()=>{
                client.ready()
                  .then(() => {
                    t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
                    t.end();
                  })
                  .catch(() => {
                    t.fail('### SDK TIMED OUT - It should not in this scenario.');
                    t.end();
                  });
              });
            },() => {
              t.fail('### SDK TIMED OUT - It should not in this scenario');
            });
        }, 1000);
      });
  }, 'Time out and then ready after retry attempt');

  // Time out and then ready after scheduled refresh. Time out is triggered, but the state changes into ready after refresh.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite6',
        events: 'https://events.baseurl/readinessSuite6'
      },
      scheduler: {
        featuresRefreshRate: 5,
        segmentsRefreshRate: 5,
      },
      startup: {
        readyTimeout: 4,
        requestTimeoutBeforeReady: 2,
        retriesOnFailureBeforeReady: 1
      }
    };

    // time of the 3rd request (in milliseconds)
    const refreshTimeMillis = 1900;
    // time difference between TIME OUT and IS READY events (in milliseconds)
    const diffTimeoutAndIsReady = ((config.startup.requestTimeoutBeforeReady*(config.startup.retriesOnFailureBeforeReady+1)+config.scheduler.featuresRefreshRate)-config.startup.readyTimeout)*1000+refreshTimeMillis;

    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      })
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      })
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, refreshTimeMillis); });
      })
      .onGet(config.urls.sdk + '/mySegments/nicolas@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsNicolas, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');
        setTimeout(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the scheduled refresh changes the client state into "is ready"');
              client.destroy().then(()=>{
                client.ready()
                  .then(() => {
                    t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
                    t.end();
                  })
                  .catch(() => {
                    t.fail('### SDK TIMED OUT - It should not in this scenario.');
                    t.end();
                  });
              });
            },() => {
              t.fail('### SDK TIMED OUT - It should not in this scenario');
            });
        }, diffTimeoutAndIsReady + 100 );
      });
  }, 'Time out and then ready after scheduled refresh');

  // Other possible tests:
  //  * Ready with retry attempts and refresh
  //  * Ready after timeout with retry attempts and refresh
}