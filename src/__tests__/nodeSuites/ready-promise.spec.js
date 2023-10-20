import sinon from 'sinon';

function fromSecondsToMillis(n) {
  return Math.round(n * 1000);
}

const consoleSpy = {
  log: sinon.spy(console, 'log'),
};

import { SplitFactory } from '../../';

import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import { mockSegmentChanges } from '../testUtils';

const baseConfig = {
  core: {
    authorizationKey: '<fake-token-3>'
  },
  debug: 'WARN',
  streamingEnabled: false
};

function assertGetTreatmentWhenReady(assert, client, key) {
  assert.equal(client.getTreatment(key, 'hierarchical_splits_test'), 'on', 'We should get an evaluation if client is ready.');
}

function assertGetTreatmentControlNotReady(assert, client, key) {
  consoleSpy.log.resetHistory();
  assert.equal(client.getTreatment(key, 'hierarchical_splits_test'), 'control', 'We should get control if client is not ready.');
  assert.true(consoleSpy.log.calledWithExactly('[WARN]  splitio => getTreatment: the SDK is not ready, results may be incorrect for feature flag hierarchical_splits_test. Make sure to wait for SDK readiness before using this method.'), 'Telling us that calling getTreatment would return CONTROL since SDK is not ready at this point.');
}

function assertGetTreatmentControlNotReadyOnDestroy(assert, client, key) {
  consoleSpy.log.resetHistory();
  assert.equal(client.getTreatment(key, 'hierarchical_splits_test'), 'control', 'We should get control if client has been destroyed.');
  assert.true(consoleSpy.log.calledWithExactly('[ERROR] splitio => getTreatment: Client has already been destroyed - no calls possible.'), 'Telling us that client has been destroyed. Calling getTreatment would return CONTROL.');
}

/* Validate readiness state transitions, warning and error messages when using ready promises. */
export default function readyPromiseAssertions(key, fetchMock, assert) {

  // Timeout with retry attempt. Timeout is triggered even when it is longer than the request time, since the first and retry requests take more than the 'requestTimeoutBeforeReady' limit.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readyPromise1',
        events: 'https://events.baseurl/readyPromise1'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 1
      }
    };

    // /splitChanges takes longer than 'requestTimeoutBeforeReady' in both attempts
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');
        assertGetTreatmentControlNotReady(t, client, key);

        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.fail('### SDK IS READY - It should not in this scenario.');
              t.end();
            })
            .catch(() => {
              t.pass('### SDK IS READY - the promise remains rejected after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
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
        sdk: 'https://sdk.baseurl/readyPromise2',
        events: 'https://events.baseurl/readyPromise2'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 1
      }
    };

    // /splitChanges takes longer than 'requestTimeoutBeforeReady' only for the first attempt
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20 });
    mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();
    // In this case, we use the manager instead of the client to get the ready promise
    const manager = splitio.manager();

    manager.ready()
      .then(() => {
        t.pass('### SDK IS READY - the retry request is under the limits.');
        assertGetTreatmentWhenReady(t, client, key);

        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
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
        sdk: 'https://sdk.baseurl/readyPromise3',
        events: 'https://events.baseurl/readyPromise3'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.1,
        retriesOnFailureBeforeReady: 1
      }
    };

    // /splitChanges takes longer than 'requestTimeoutBeforeReady' only for the first attempt
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20 });
    mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - time out is triggered before retry attempt finishes');
        assertGetTreatmentControlNotReady(t, client, key);

        setTimeout(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - retry attempt finishes before the requestTimeoutBeforeReady limit');
              assertGetTreatmentWhenReady(t, client, key);

              client.destroy().then(() => {
                client.ready()
                  .then(() => {
                    t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
                    assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
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

  // Time out and then ready after scheduled refresh. Time out is triggered, but the state changes into ready after refresh.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readyPromise4',
        events: 'https://events.baseurl/readyPromise4'
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

    // /splitChanges takes longer than 'requestTimeoutBeforeReady' in both initial attempts
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: refreshTimeMillis });
    mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      })
      .catch(() => {
        t.pass('### SDK TIMED OUT - Requests took longer than we allowed per requestTimeoutBeforeReady on both attempts, timed out.');
        assertGetTreatmentControlNotReady(t, client, key);

        setTimeout(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the scheduled refresh changes the client state into "is ready"');
              assertGetTreatmentWhenReady(t, client, key);

              client.destroy().then(() => {
                client.ready()
                  .then(() => {
                    t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
                    assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
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
        }, diffTimeoutAndIsReady + 20);
      });
  }, 'Time out and then ready after scheduled refresh');

  // Validate fallback to 'catch' callback when exception is thrown on 'then' onRejected callback.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readyPromise5',
        events: 'https://events.baseurl/readyPromise5'
      },
      startup: {
        readyTimeout: 0.1,
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 0
      }
    };

    // /splitChanges takes longer than 'requestTimeoutBeforeReady'
    fetchMock.get(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
        client.destroy().then(() => { t.end(); });
      }, () => {
        t.pass('### SDK TIMED OUT - Request tooks longer than we allowed per requestTimeoutBeforeReady, timed out.');
        assertGetTreatmentControlNotReady(t, client, key);
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
              assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
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
        sdk: 'https://sdk.baseurl/readyPromise6',
        events: 'https://events.baseurl/readyPromise6'
      },
      startup: {
        readyTimeout: 0.1,
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 0
      }
    };

    // /splitChanges takes less than 'requestTimeoutBeforeReady'
    fetchMock.get(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20 });
    mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    client.ready()
      .then(() => {
        t.pass('### SDK IS READY as it should, request is under the limits.');
        assertGetTreatmentWhenReady(t, client, key);
        throw 'error';
      })
      .catch((error) => {
        t.equal(error, 'error', '### Handled thrown exception on onRejected callback.');
        client.destroy().then(() => {
          client.ready()
            .then(() => {
              t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
              assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
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
        sdk: 'https://sdk.baseurl/readyPromise7',
        events: 'https://events.baseurl/readyPromise7'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.1,
        retriesOnFailureBeforeReady: 1
      }
    };

    // /splitChanges takes longer than 'requestTimeoutBeforeReady' only for the first attempt
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20 });
    mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();
    // We also use the manager to get some of the promises
    const manager = splitio.manager();

    // `ready` is called immediately. Thus, the 'reject' callback is expected to be called in 0.15 seconds aprox.
    setTimeout(() => {
      const tStart = Date.now();
      client.ready()
        .then(() => {
          t.fail('### SDK IS READY - not TIMED OUT when it should.');
        })
        .catch(() => {
          t.pass('### SDK TIMED OUT - time out is triggered before retry attempt finishes');
          assertGetTreatmentControlNotReady(t, client, key);
          const tDelta = Date.now() - tStart;
          assert.ok(tDelta < fromSecondsToMillis(config.startup.readyTimeout) + 20 && tDelta > fromSecondsToMillis(config.startup.readyTimeout) - 20, 'The "reject" callback is expected to be called in 0.15 seconds aprox');
        });
    }, 0);

    // `ready` is called in 0.15 seconds, when the promise is just rejected. Thus, the 'reject' callback is expected to be called immediately (0 seconds aprox).
    setTimeout(() => {
      const tStart = Date.now();
      manager.ready()
        .then(() => {
          t.fail('### SDK IS READY - not TIMED OUT when it should.');
        })
        .catch(() => {
          t.pass('### SDK TIMED OUT - time out is triggered before retry attempt finishes');
          assertGetTreatmentControlNotReady(t, client, key);
          const tDelta = Date.now() - tStart;
          assert.ok(tDelta < 20, 'The "reject" callback is expected to be called immediately (0 seconds aprox).');
        });
    }, fromSecondsToMillis(0.15));

    // `ready` is called in 0.25 seconds, right after the promise is resolved (0.2 secs). Thus, the 'resolve' callback is expected to be called immediately (0 seconds aprox).
    setTimeout(() => {
      const tStart = Date.now();
      manager.ready()
        .then(() => {
          t.pass('### SDK IS READY - retry attempt finishes before the requestTimeoutBeforeReady limit');
          assertGetTreatmentWhenReady(t, client, key);
          const tDelta = Date.now() - tStart;
          assert.ok(tDelta < 20, 'The "resolve" callback is expected to be called immediately (0 seconds aprox).');

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
                assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
                t.end();
              })
              .catch(() => {
                t.fail('### SDK TIMED OUT - It should not in this scenario.');
                t.end();
              });
          });
        });
    }, fromSecondsToMillis(0.25));
  }, 'Evaluate that multiple promises are resolved/rejected on expected times.');

  // Validate that warning messages are properly sent.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readyPromise8',
        events: 'https://events.baseurl/readyPromise8'
      },
      startup: {
        readyTimeout: 0.15,
        requestTimeoutBeforeReady: 0.1,
        retriesOnFailureBeforeReady: 1
      }
    };

    // /splitChanges takes longer than 'requestTimeoutBeforeReady' only for the first attempt
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    fetchMock.getOnce(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) - 20 });
    mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

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

      assertGetTreatmentWhenReady(t, client, key);
      t.true(consoleSpy.log.calledWithExactly('[WARN]  splitio => No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.'),
        'Warning that there are not listeners for SDK_READY event');

      // assert error messages when adding event listeners after SDK has already triggered them
      consoleSpy.log.resetHistory();
      client.on(client.Event.SDK_READY, () => { });
      client.on(client.Event.SDK_READY_TIMED_OUT, () => { });
      t.true(consoleSpy.log.calledWithExactly('[ERROR] splitio => A listener was added for SDK_READY on the SDK, which has already fired and won\'t be emitted again. The callback won\'t be executed.'),
        'Logging error that a listeners for SDK_READY event was added after triggered');
      t.true(consoleSpy.log.calledWithExactly('[ERROR] splitio => A listener was added for SDK_READY_TIMED_OUT on the SDK, which has already fired and won\'t be emitted again. The callback won\'t be executed.'),
        'Logging error that a listeners for SDK_READY_TIMED_OUT event was added after triggered');

      client.destroy().then(() => {
        client.ready()
          .then(() => {
            t.pass('### SDK IS READY - the promise remains resolved after client destruction.');
            assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
            t.end();
          })
          .catch(() => {
            t.fail('### SDK TIMED OUT - It should not in this scenario.');
            t.end();
          });
      });
    }, fromSecondsToMillis(0.2));

  }, 'Validate that warning messages are properly sent');


  // Time out event is not handled. Ready promise should not be resolved.
  assert.test(t => {
    const config = {
      ...baseConfig,
      urls: {
        sdk: 'https://sdk.baseurl/readyPromise9',
        events: 'https://events.baseurl/readyPromise9'
      },
      startup: {
        readyTimeout: 0.1, // We use a short ready timeout to don't extend to much the test
        requestTimeoutBeforeReady: 0.05,
        retriesOnFailureBeforeReady: 0
      }
    };

    // /splitChanges takes longer than 'requestTimeoutBeforeReady'
    fetchMock.get(config.urls.sdk + '/splitChanges?since=-1', splitChangesMock1, { delay: fromSecondsToMillis(config.startup.requestTimeoutBeforeReady) + 20 });
    mockSegmentChanges(fetchMock, new RegExp(config.urls.sdk + '/segmentChanges/*'), ['some_key']);
    fetchMock.postOnce(config.urls.events + '/testImpressions/bulk', 200);
    fetchMock.postOnce(config.urls.events + '/testImpressions/count', 200);

    const splitio = SplitFactory(config);
    const client = splitio.client();

    // Assert getTreatment return CONTROL and trigger warning when SDK is not ready yet
    assertGetTreatmentControlNotReady(t, client, key);

    client.ready()
      .then(() => {
        t.fail('### SDK IS READY - not TIMED OUT when it should.');
      });

    setTimeout(() => {
      client.destroy().then(() => {
        client.ready()
          .then(() => {
            t.fail('### SDK IS READY - It should not in this scenario.');
            t.end();
          })
          .catch(() => {
            t.pass('### SDK IS READY - the promise remains rejected after client destruction.');
            assertGetTreatmentControlNotReadyOnDestroy(t, client, key);
            t.end();
          });
      });
    }, fromSecondsToMillis(config.startup.readyTimeout) + 20);

  }, 'Time out event is not handled. Ready promise should not be resolved');

  // Other possible tests:
  //  * Basic time out path: startup without retries on failure and response taking more than 'requestTimeoutBeforeReady'.
  //  * Basic is ready path: startup without retries on failure and response taking less than 'requestTimeoutBeforeReady'.
  //  * Ready with retry attempts and refresh.
  //  * Ready after timeout with retry attempts and refresh.
}
