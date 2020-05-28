import sinon from 'sinon';
import { nearlyEqual } from '../utils';

function fromSecondsToMillis(n) {
  return Math.round(n * 1000);
}

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
  },
  debug: 'WARN'
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
  assert.true(consoleSpy.log.calledWithExactly('[ERROR] Client has already been destroyed - no calls possible.'), 'Telling us that client has been destroyed. Calling getTreatment would return CONTROL.');
}

/* Validate readiness state transitions, warning and error messages when using ready promises. */
export default function readyPromiseAssertions(fetchMock, assert) {

  // Timeout with retry attempt. Timeout is triggered even when it is longer than the request time, since the first and retry requests take more than the 'requestTimeoutBeforeReady' limit.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite3',
        events: 'https://events.baseurl/readinessSuite3'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 1
      }
    };

    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    });
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

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

  // Ready with retry attempt. The retry attempt is below the 'requestTimeoutBeforeReady' limit.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite4',
        events: 'https://events.baseurl/readinessSuite4'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 1
      }
    };

    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();
    // In this case, we use the manager instead of the client to get the ready promise
    const manager = splitio.manager();

    manager.ready()
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

  // Time out and then ready after retry attempt. Time out is triggered, but the retry attempt is below the 'requestTimeoutBeforeReady' limit.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite5',
        events: 'https://events.baseurl/readinessSuite5'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.1,
        retriesOnFailureBeforeReady: 1
      }
    };

    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

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
            }, () => {
              t.fail('### SDK TIMED OUT - It should not in this scenario');
            });
        }, fromSecondsToMillis(0.1));
      });
  }, 'Time out and then ready after retry attempt');

  // Time out and then ready after scheduled refresh. Time out is triggered, but the state changes into ready after refresh (include assert on shared client)
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite6',
        events: 'https://events.baseurl/readinessSuite6'
      },
      scheduler: {
        featuresRefreshRate: 0.25,
        segmentsRefreshRate: 0.25,
      },
      startup: {
        readyTimeout: 0.2,
        requestTimeoutBeforeReady: 0.1,
        retriesOnFailureBeforeReady: 1
      }
    };

    // time of the 3rd request (in milliseconds)
    const refreshTimeMillis = 50;
    // time difference between TIME OUT and IS READY events (in milliseconds)
    const diffTimeoutAndIsReady = fromSecondsToMillis(
      (config.startup.requestTimeoutBeforeReady * (config.startup.retriesOnFailureBeforeReady + 1) +
        config.scheduler.featuresRefreshRate) - config.startup.readyTimeout) + refreshTimeMillis;

    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, refreshTimeMillis); });
    });
    // main client endpoint configured to fetch segments before request timeout
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.get(config.urls.sdk + '/splitChanges?since=1457552620999', { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
    // shared client endpoint configured to fetch segments immediately, in order to emit SDK_READY as soon as splits arrives
    fetchMock.get(config.urls.sdk + '/mySegments/nicolas@split.io', { status: 200, body: mySegmentsFacundo });
    // shared client endpoint configured to emit SDK_READY_TIMED_OUT
    fetchMock.get(config.urls.sdk + '/mySegments/emiliano@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.readyTimeout) + 20); });
    });

    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();
    const nicolasClient = splitio.client('nicolas@split.io');

    nicolasClient.on(nicolasClient.Event.SDK_READY_TIMED_OUT, () => { console.log('nico SDK_READY_TIMED_OUT'); });
    nicolasClient.on(nicolasClient.Event.SDK_READY, () => { console.log('nico SDK_READY'); });

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');
        assertGetTreatmentControlNotReady(t, client);

        client.on(client.Event.SDK_READY, () => {
          client.ready().then(() => {
            t.pass('### SDK IS READY - the scheduled refresh changes the client state into "ready"');
            assertGetTreatmentWhenReady(t, client);

            const tStart = Date.now();
            nicolasClient.ready().then(() => {
              const delta = Date.now() - tStart;
              t.true(nearlyEqual(delta, 0), 'shared client is ready as soon as main client is ready (i.e., splits have arrived)');

              const timeoutClient = splitio.client('emiliano@split.io');
              timeoutClient.ready().then(undefined, () => { // setting onRejected handler via `then` method
                t.pass('### Shared client TIMED OUT - promise rejected since mySegments fetch took more time than readyTimeout');
                timeoutClient.ready().catch(() => { // setting onRejected handler via `catch` method
                  t.pass('### Shared client TIMED OUT - promise keeps being rejected');
                  timeoutClient.on(timeoutClient.Event.SDK_READY, () => {
                    timeoutClient.ready().then(() => {
                      t.pass('### Shared client READY - `ready` returns a new resolved promise');
                      Promise.all([timeoutClient.destroy(), nicolasClient.destroy(), client.destroy()]).then(() => {
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
                  });
                });
              });
            }, () => {
              t.fail('### SDK TIMED OUT - It should not in this scenario');
            });
          }, diffTimeoutAndIsReady + 20);
        });
      });
  }, 'Time out and then ready after scheduled refresh (include assert on shared client)');

  // Validate fallback to 'catch' callback when exception is thrown on 'then' onRejected callback.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite7',
        events: 'https://events.baseurl/readinessSuite7'
      },
      startup: {
        readyTimeout: 0.1,
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 0
      }
    };

    fetchMock.get(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    }); // /splitChanges takes longer than 'requestTimeoutBeforeReady'
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
        client.destroy().then(() => { t.end(); });
      }, () => {
        t.pass('### SDK TIMED OUT - Request tooks longer than we allowed per requestTimeoutBeforeReady, timed out.');
        assertGetTreatmentControlNotReady(t, client);
        throw 'error';
      })
      .catch((error) => {
        t.equal(error, 'error', '### Handled thrown exception on onRejected callback.');
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

  // Validate fallback to 'catch' callback when exception is thrown on 'then' onResolved callback.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite8',
        events: 'https://events.baseurl/readinessSuite8'
      },
      startup: {
        readyTimeout: 0.1,
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 0
      }
    };

    fetchMock.get(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    }); // Both /splitChanges and /mySegments take less than 'requestTimeoutBeforeReady'
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.pass('### SDK IS READY as it should, request is under the limits.');
        assertGetTreatmentWhenReady(t, client);
        throw 'error';
      })
      .catch((error) => {
        t.equal(error, 'error', '### Handled thrown exception on onRejected callback.');
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

  // Validate that multiple promises are resolved/rejected on expected times.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite9',
        events: 'https://events.baseurl/readinessSuite9'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.1,
        retriesOnFailureBeforeReady: 1
      }
    };

    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();
    // We also use the manager to get some of the promises
    const manager = splitio.manager();

    // promise1 is handled inmediately. Thus, the 'reject' callback is expected to be called in 0.15 seconds aprox.
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
          assert.ok(tDelta < fromSecondsToMillis(config.startup.readyTimeout) + 20 && tDelta > fromSecondsToMillis(config.startup.readyTimeout) - 20, 'The "reject" callback is expected to be called in 0.15 seconds aprox');
        });
    }, 0);

    // promise2 is handled in 0.15 seconds, when the promise is just rejected. Thus, the 'reject' callback is expected to be called inmediately (0 seconds aprox).
    setTimeout(() => {
      const promise2 = manager.ready();
      const tStart = Date.now();
      promise2
        .then(() => {
          t.fail('### SDK IS READY - not TIMED OUT when it should.');
        })
        .catch(() => {
          t.pass('### SDK TIMED OUT - time out is triggered before retry attempt finishes');
          assertGetTreatmentControlNotReady(t, client);
          const tDelta = Date.now() - tStart;
          assert.ok(tDelta < 20, 'The "reject" callback is expected to be called inmediately (0 seconds aprox).');
        });
    }, fromSecondsToMillis(0.15));

    // promise3 is handled in 0.2 seconds, when the promise is just resolved. Thus, the 'resolve' callback is expected to be called inmediately (0 seconds aprox).
    setTimeout(() => {
      const promise3 = manager.ready();
      const tStart = Date.now();
      promise3
        .then(() => {
          t.pass('### SDK IS READY - retry attempt finishes before the requestTimeoutBeforeReady limit');
          assertGetTreatmentWhenReady(t, client);
          const tDelta = Date.now() - tStart;
          assert.ok(tDelta < 20, 'The "resolve" callback is expected to be called inmediately (0 seconds aprox).');

          return Promise.resolve();
        }, () => {
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
    }, fromSecondsToMillis(0.2));
  }, 'Evaluate that multiple promises are resolved/rejected on expected times.');

  // Validate that warning messages are properly sent.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite10',
        events: 'https://events.baseurl/readinessSuite10'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.1,
        retriesOnFailureBeforeReady: 1
      }
    };

    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

    const splitio = SplitFactory(config);

    const onReadycallback = function () { };

    // We invoke the ready method and also add and remove SDK_READY event listeners using the client and manager instances
    const client = splitio.client();
    client.ready();
    client.on(client.Event.SDK_READY, onReadycallback);
    client.off(client.Event.SDK_READY, onReadycallback);

    const manager = splitio.manager();
    manager.ready();
    manager.on(manager.Event.SDK_READY, onReadycallback);
    manager.off(manager.Event.SDK_READY, onReadycallback);

    consoleSpy.log.resetHistory();
    setTimeout(() => {
      client.ready();

      assertGetTreatmentWhenReady(t, client);
      t.true(consoleSpy.log.calledWithExactly('[WARN]  No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.'),
        'Warning that there are not listeners for SDK_READY event');

      consoleSpy.log.resetHistory();
      client.on(client.Event.SDK_READY, () => { });
      client.on(client.Event.SDK_READY_TIMED_OUT, () => { });
      t.true(consoleSpy.log.calledWithExactly('[ERROR] A listener was added for SDK_READY on the SDK, which has already fired and won\'t be emitted again. The callback won\'t be executed.'),
        'Logging error that a listeners for SDK_READY event was added after triggered');
      t.true(consoleSpy.log.calledWithExactly('[ERROR] A listener was added for SDK_READY_TIMED_OUT on the SDK, which has already fired and won\'t be emitted again. The callback won\'t be executed.'),
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
    }, fromSecondsToMillis(0.2));

  }, 'Validate that warning messages are properly sent');

  // Time out event is not handled. Ready promise should not be resolved (include assert on shared client)
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readinessSuite11',
        events: 'https://events.baseurl/readinessSuite11'
      },
      startup: {
        readyTimeout: 0.1, // We use a short ready timeout to don't extend to much the test
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 0
      }
    };

    fetchMock.get(config.urls.sdk + '/splitChanges?since=-1', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: splitChangesMock1 }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20); });
    }); // /splitChanges takes longer than 'requestTimeoutBeforeReady'
    fetchMock.get(config.urls.sdk + '/mySegments/facundo@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.get(config.urls.sdk + '/mySegments/nicolas@split.io', function () {
      return new Promise((res) => { setTimeout(() => { res({ status: 200, body: mySegmentsFacundo }); }, fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20); });
    });
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();
    const otherClient = splitio.client('nicolas@split.io');

    // Assert getTreatment return CONTROL and trigger warning when SDK is not ready yet
    assertGetTreatmentControlNotReady(t, client);

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      });
    otherClient.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      });

    setTimeout(() => {
      Promise.all([client.destroy(), otherClient.destroy()]).then(() => {
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
    }, fromSecondsToMillis(config.startup.readyTimeout) + 20);

  }, 'Time out event is not handled. Ready promise should not be resolved (include assert on shared client)');

  // Other possible tests:
  //  * Basic time out path: startup without retries on failure and response taking more than 'requestTimeoutBeforeReady'.
  //  * Basic is ready path: startup without retries on failure and response taking less than 'requestTimeoutBeforeReady'.
  //  * Ready with retry attempts and refresh.
  //  * Ready after timeout with retry attempts and refresh.
}