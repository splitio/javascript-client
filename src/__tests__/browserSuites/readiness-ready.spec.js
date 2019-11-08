import sinon from 'sinon';

const consoleSpy = {
  log: sinon.spy(console, 'log'),
  error: sinon.spy(console, 'error'),
};

import { SplitFactory } from '../..';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';

const baseConfig = {
  core: {
    authorizationKey: '<fake-token-3>',
    key: 'facundo@split.io',
  }
};

function assertGetTreatmentWhenReady(assert, client) {
  assert.equal(client.getTreatment('hierarchical_splits_test'), 'on', 'We should get an evaluation if client is ready.');
}

function assertGetTreatmentControlNotReady(assert, client) {
  consoleSpy.log.resetHistory();
  assert.equal(client.getTreatment('hierarchical_splits_test'), 'control', 'We should get control if client is not ready.');
  assert.true(consoleSpy.log.calledWithExactly('[WARN]  getTreatment: the SDK is not ready, results may be incorrect. Make sure to wait for SDK readiness before using this method.'), 'Telling us that calling getTreatment would return CONTROL since SDK is not ready at this point.');
}

function assertGetTreatmentControlNotReadyOnDestroy(assert, client) {
  consoleSpy.log.resetHistory();
  assert.equal(client.getTreatment('hierarchical_splits_test'), 'control', 'We should get control if client has been destroyed.');
  assert.true(consoleSpy.error.calledWithExactly('[ERROR] Client has already been destroyed - no calls possible.'), 'Telling us that client has been destroyed. Calling getTreatment would return CONTROL.');
}

export default function readyPromiseAssertions(mock, assert) {

  /* Validate Readiness state transitions */

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
      },
      debug: true
    };
    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      }) // /splitChanges takes longer than 'requestTimeoutBeforeReady'
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    // Assert getTreatment return CONTROL and trigger warning when SDK is not ready yet
    assertGetTreatmentControlNotReady(t, client);
    
    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
        client.destroy().then(() => { t.end(); });
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Request tooks longer than we allowed per requestTimeoutBeforeReady, timed out.');
        assertGetTreatmentControlNotReady(t, client);

        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.fail('### SDK IS READY - It should not in this scenario.');
              t.end();
            })
            .catch(() => {
              t.pass('### SDK TIME OUT - the promise remains rejected after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client);
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
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      }); // Both /splitChanges and /mySegments take less than 'requestTimeoutBeforeReady'

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.pass('### SDK IS READY as it should, request is under the limits.');
        assertGetTreatmentWhenReady(t, client);

        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client);
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
  }, 'Basic "is ready" test. Responses are below than allowed per requestTimeoutBeforeReady');

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
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');
        assertGetTreatmentControlNotReady(t, client);

        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.fail('### SDK IS READY - It should not in this scenario.');
              t.end();
            })
            .catch(() => {
              t.pass('### SDK IS READY - the promise remains rejected after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client);
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
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.pass('### SDK IS READY - the retry request is under the limits.');
        assertGetTreatmentWhenReady(t, client);

        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client);
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
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - time out is triggered before retry attempt finishes');
        assertGetTreatmentControlNotReady(t, client);

        setTimeout(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - retry attempt finishes before the requestTimeoutBeforeReady limit');
              assertGetTreatmentWhenReady(t, client);

              client.destroy().then(() => {
                client.ready()
                  .then(() => {
                    t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
                    assertGetTreatmentControlNotReadyOnDestroy(t, client);
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
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');
        assertGetTreatmentControlNotReady(t, client);

        setTimeout(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the scheduled refresh changes the client state into "is ready"');
              assertGetTreatmentWhenReady(t, client);

              client.destroy().then(() => {
                client.ready()
                  .then(() => {
                    t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
                    assertGetTreatmentControlNotReadyOnDestroy(t, client);
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

  /* Validate fallback to 'catch' callback when exception is thrown on 'then' callbacks */

  // Basic "time out" test with exception on onRejected callback.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite7',
        events: 'https://events.baseurl/readinessSuite7'
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
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
        client.destroy().then(() => { t.end(); });
      },() => {
        t.pass('### SDK TIMED OUT - Request tooks longer than we allowed per requestTimeoutBeforeReady, timed out.');
        assertGetTreatmentControlNotReady(t, client);
        throw 'error';
      })
      .catch((error) => {
        t.equal(error,'error','### Handled thrown exception on onRejected callback.');
        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.fail('### SDK IS READY - It should not in this scenario.');
              t.end();
            })
            .catch(() => {
              t.pass('### SDK TIME OUT - the promise remains rejected after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client);
              t.end();
            });
        });
      });
  }, 'Basic "time out" test with exception on onRejected callback.');

  // Basic "is ready" test with exception on onResolved callback.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite8',
        events: 'https://events.baseurl/readinessSuite8'
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
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      }); // Both /splitChanges and /mySegments take less than 'requestTimeoutBeforeReady'

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.pass('### SDK IS READY as it should, request is under the limits.');
        assertGetTreatmentWhenReady(t, client);
        throw 'error';

      })
      .catch((error) => {
        t.equal(error,'error','### Handled thrown exception on onRejected callback.');
        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client);
              t.end();
            })
            .catch(() => {
              t.fail('### SDK TIMED OUT - It should not in this scenario.');
              t.end();
            });
        });
      });
  }, 'Basic "is ready" test with exception on onResolved callback');

  /* Validate that multiple promises are resolved/rejected on expected times. */

  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite9',
        events: 'https://events.baseurl/readinessSuite9'
      },
      scheduler: {
        featuresRefreshRate: 3000,
        segmentsRefreshRate: 3000,
      },
      startup: {
        readyTimeout: 3,
        requestTimeoutBeforeReady: 2,
        retriesOnFailureBeforeReady: 1
      },
      debug: true,
    };
    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      })
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      })
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    // promise1 is handled inmediately. Thus, the 'reject' callback is expected to be called in 3 seconds aprox.
    setTimeout(() => {
      const promise1 = client.ready();
      const tStart = Date.now();
      promise1
        .then(() => {
          t.fail('### SDK IS READY - not TIMED OUT when it should.');
        })
        .catch(() => {
          t.pass('### SDK TIMED OUT - time out is triggered before retry attempt finishes');
          assertGetTreatmentControlNotReady(t, client);
          const tDelta = Date.now() - tStart;
          assert.ok( tDelta < config.startup.readyTimeout * 1000 + 20 && tDelta > config.startup.readyTimeout * 1000 - 20, 'The "reject" callback is expected to be called in 3 seconds aprox');
        });
    }, 0);

    // promise2 is handled in 3 seconds, when the promise is just rejected. Thus, the 'reject' callback is expected to be called inmediately (0 seconds aprox).
    setTimeout(() => {
      const promise2 = client.ready();
      const tStart = Date.now();
      promise2
        .then(() => {
          t.fail('### SDK IS READY - not TIMED OUT when it should.');
        })
        .catch(() => {
          t.pass('### SDK TIMED OUT - time out is triggered before retry attempt finishes');
          //assertGetTreatmentControlNotReady(t, client);
          const tDelta = Date.now() - tStart;
          assert.ok( tDelta < 20, 'The "reject" callback is expected to be called inmediately (0 seconds aprox).');
        });
    }, 3000);

    // promise3 is handled in 4 seconds, when the promise is just resolved. Thus, the 'resolve' callback is expected to be called inmediately (0 seconds aprox).
    setTimeout(() => {
      const promise3 = client.ready();
      const tStart = Date.now();
      promise3
        .then(() => {
          t.pass('### SDK IS READY - retry attempt finishes before the requestTimeoutBeforeReady limit');
          assertGetTreatmentWhenReady(t, client);
          const tDelta = Date.now() - tStart;
          assert.ok( tDelta < 20, 'The "resolve" callback is expected to be called inmediately (0 seconds aprox).');

          return Promise.resolve();
        },() => {
          t.fail('### SDK TIMED OUT - It should not in this scenario');
          return Promise.resolve();
        })
        .then(() => {
          client.destroy().then(() => {
            client.ready()
              .then(() => {
                t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
                assertGetTreatmentControlNotReadyOnDestroy(t, client);
                t.end();
              })
              .catch(() => {
                t.fail('### SDK TIMED OUT - It should not in this scenario.');
                t.end();
              });
          });
        });
    }, 4000 );
  }, 'Evaluate that multiple promises are resolved/rejected on expected times.');

  /* Validate that warning messages are properly sent */

  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite10',
        events: 'https://events.baseurl/readinessSuite10'
      },
      scheduler: {
        featuresRefreshRate: 3000,
        segmentsRefreshRate: 3000,
      },
      startup: {
        readyTimeout: 3,
        requestTimeoutBeforeReady: 2,
        retriesOnFailureBeforeReady: 1
      },
      debug: true,
    };
    mock
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000+100); });
      })
      .onGet(config.urls.sdk + '/splitChanges?since=-1').replyOnce(function() {
        return new Promise((res) => { setTimeout(() => { res([200, splitChangesMock1, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      })
      .onGet(config.urls.sdk + '/mySegments/facundo@split.io').reply(function() {
        return new Promise((res) => { setTimeout(() => { res([200, mySegmentsFacundo, {}]); }, config.startup.requestTimeoutBeforeReady*1000-100); });
      });

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready();
    
    const onReadycallback = function() {};
    client.ready();
    client.on(client.Event.SDK_READY, onReadycallback);
    client.off(client.Event.SDK_READY, onReadycallback);

    consoleSpy.log.resetHistory();
    setTimeout(() => {
      client.ready();
      
      assertGetTreatmentWhenReady(t, client);
      t.true(consoleSpy.log.calledWithExactly('[WARN]  No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.'),
        'Warning that there are not listeners for SDK_READY event');

      consoleSpy.log.resetHistory();
      client.on(client.Event.SDK_READY, () => {});
      client.on(client.Event.SDK_READY_TIMED_OUT, () => {});
      t.true(consoleSpy.error.calledWithExactly('[ERROR] A listener was added for SDK_READY on the SDK, which has already fired and won\'t be emitted again. The callback won\'t be executed.'),
        'Logging error that a listeners for SDK_READY event was added after triggered');
      t.true(consoleSpy.error.calledWithExactly('[ERROR] A listener was added for SDK_READY_TIMED_OUT on the SDK, which has already fired and won\'t be emitted again. The callback won\'t be executed.'),
        'Logging error that a listeners for SDK_READY_TIMED_OUT event was added after triggered');

      client.destroy().then(() => {
        client.ready()
          .then(() => {
            t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
            assertGetTreatmentControlNotReadyOnDestroy(t, client);
            t.end();
          })
          .catch(() => {
            t.fail('### SDK TIMED OUT - It should not in this scenario.');
            t.end();
          });
      });  
    }, 4500);

  }, 'Validate that warning messages are properly sent');

  // Other possible tests:
  //  * Ready with retry attempts and refresh
  //  * Ready after timeout with retry attempts and refresh
}