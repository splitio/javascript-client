// This is a "node" test suite because we need proxyquire as well as we have
// no differences in functionality when on the browser. When revamping the testing fwk
// analyze moving to a test that runs on both suites.
import tape from 'tape';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();

const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
// Import the module mocking the logger.
const statusManager = proxyquireStrict('../statusManager', {
  '../utils/logger': LogFactoryMock
}).default;

tape('Readiness Callbacks handler - Event emitter and returned handler', t => {
  const gateMock = {
    on: sinon.stub(),
    once: sinon.stub(),
    SDK_READY: 'sdk_ready_event',
    SDK_READY_FROM_CACHE: 'sdk_ready_from_cache_event',
    SDK_READY_TIMED_OUT: 'sdk_ready_timeout_event',
    SDK_UPDATE: 'sdk_update',
  };
  const contextMock = {
    put: sinon.stub(),
    get: entityName => entityName === 'readiness_gate' ? { gate: gateMock } : null,
    constants: {
      READINESS: 'readiness_gate',
      READY: 'is_ready'
    }
  };
  function resetStubs() {
    contextMock.put.resetHistory();
    gateMock.on.resetHistory();
    gateMock.once.resetHistory();
    loggerMock.warn.resetHistory();
    loggerMock.error.resetHistory();
  }

  t.test('Providing the gate object to get the SDK status interface that manages events', assert => {
    assert.equal(typeof statusManager, 'function', 'The module exposes a function.');

    const statusInterface = statusManager(contextMock);
    assert.equal(typeof statusInterface, 'object', 'The function receives the readiness gate and outputs a map.');
    Object.keys(gateMock).forEach(propName => {
      assert.true(statusInterface[propName], 'The map exposes all gate functionality.');
    });

    assert.equal(typeof statusInterface['ready'], 'function', 'The map exposes a .ready() function.');

    assert.equal(typeof statusInterface.Event, 'object', 'It also exposes the Event map,');
    assert.equal(statusInterface.Event.SDK_READY, gateMock.SDK_READY, 'which contains the constants for the events, for backwards compatibility.');
    assert.equal(statusInterface.Event.SDK_READY_FROM_CACHE, gateMock.SDK_READY_FROM_CACHE, 'which contains the constants for the events, for backwards compatibility.');
    assert.equal(statusInterface.Event.SDK_READY_TIMED_OUT, gateMock.SDK_READY_TIMED_OUT, 'which contains the constants for the events, for backwards compatibility.');
    assert.equal(statusInterface.Event.SDK_UPDATE, gateMock.SDK_UPDATE, 'which contains the constants for the events, for backwards compatibility.');

    assert.equal(gateMock.once.callCount, 4, 'It should make four one time only subscriptions');

    const sdkReadyResolvePromiseCall = gateMock.once.getCall(0);
    const sdkReadyRejectPromiseCall = gateMock.once.getCall(1);
    const sdkReadyListenersCheckCall = gateMock.once.getCall(2);
    const sdkReadyFromCacheListenersCheckCall = gateMock.once.getCall(3);
    assert.equal(sdkReadyResolvePromiseCall.args[0], gateMock.SDK_READY, 'A one time only subscription is also on the SDK_READY event, for resolving the full blown ready promise.');
    assert.equal(sdkReadyRejectPromiseCall.args[0], gateMock.SDK_READY_TIMED_OUT, 'A one time only subscription is also on the SDK_READY_TIMED_OUT event, for rejecting the full blown ready promise.');
    assert.equal(sdkReadyListenersCheckCall.args[0], gateMock.SDK_READY, 'A one time only subscription is on the SDK_READY event, to check for callbacks warning.');
    assert.equal(sdkReadyFromCacheListenersCheckCall.args[0], gateMock.SDK_READY_FROM_CACHE, 'A one time only subscription is on the SDK_READY_FROM_CACHE event, to log the event and update internal state.');

    assert.ok(gateMock.on.calledTwice, 'It should also add two persistent listeners');

    const removeListenerSubCall = gateMock.on.getCall(0);
    const addListenerSubCall = gateMock.on.getCall(1);

    assert.equal(removeListenerSubCall.args[0], 'removeListener', 'First subscription should be made to the removeListener event.');
    assert.equal(addListenerSubCall.args[0], 'newListener', 'Second subscription should be made to the newListener event, after the removeListener one so we avoid an unnecessary trigger.');

    resetStubs();
    assert.end();
  });

  t.test('The event callbacks should work as expected - SDK_READY emits with no callbacks', assert => {
    statusManager(contextMock);

    // Get the callbacks
    const readyEventCB = gateMock.once.getCall(2).args[1];
    const addListenerCB = gateMock.on.getCall(1).args[1];

    readyEventCB();
    assert.true(loggerMock.warn.calledOnce, 'If the SDK_READY event fires and we have no callbacks for it (neither event nor ready promise) we get a warning.');
    assert.true(loggerMock.warn.calledWithExactly('No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.'), 'Telling us there were no listeners and evaluations before this point may have been incorrect.');
    assert.true(contextMock.put.calledOnceWithExactly(contextMock.constants.READY, true), 'It also takes care of marking the SDK ');

    // Now it's marked as ready.
    addListenerCB('this event we do not care');
    assert.false(loggerMock.error.called, 'Now if we add a listener to an event unrelated with readiness, we get no errors logged.');

    addListenerCB(gateMock.SDK_READY);
    assert.true(loggerMock.error.calledOnceWithExactly('A listener was added for SDK_READY on the SDK, which has already fired and won\'t be emitted again. The callback won\'t be executed.'), 'If we try to add a listener to SDK_READY we get the corresponding warning.');

    loggerMock.error.resetHistory();
    addListenerCB(gateMock.SDK_READY_TIMED_OUT);
    assert.true(loggerMock.error.calledOnceWithExactly('A listener was added for SDK_READY_TIMED_OUT on the SDK, which has already fired and won\'t be emitted again. The callback won\'t be executed.'), 'If we try to add a listener to SDK_READY we get the corresponding warning.');

    resetStubs();
    assert.end();
  });

  t.test('The event callbacks should work as expected - SDK_READY emits with callbacks', assert => {
    statusManager(contextMock);

    // Get the callbacks
    const readyEventCB = gateMock.once.getCall(2).args[1];
    const addListenerCB = gateMock.on.getCall(1).args[1];

    addListenerCB(gateMock.SDK_READY);
    assert.false(loggerMock.warn.called, 'We are adding a listener to the ready event before it is ready, so no warnings are logged.');
    assert.false(loggerMock.error.called, 'We are adding a listener to the ready event before it is ready, so no errors are logged.');

    readyEventCB();
    assert.false(loggerMock.warn.called, 'As we had at least one listener, we get no warnings.');
    assert.false(loggerMock.error.called, 'As we had at least one listener, we get no errors.');

    resetStubs();
    assert.end();
  });

  t.test('The event callbacks should work as expected - If we end up removing the listeners for SDK_READY, it behaves as if it had none', assert => {
    statusManager(contextMock);

    // Get the callbacks
    const readyEventCB = gateMock.once.getCall(2).args[1];
    const addListenerCB = gateMock.on.getCall(1).args[1];
    const removeListenerCB = gateMock.on.getCall(0).args[1];

    // Fake adding two listeners
    addListenerCB(gateMock.SDK_READY);
    addListenerCB(gateMock.SDK_READY);

    // And then fake remove them.
    removeListenerCB(gateMock.SDK_READY);
    removeListenerCB(gateMock.SDK_READY);

    readyEventCB();
    assert.true(loggerMock.warn.calledWithExactly('No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.'), 'We get the warning.');

    resetStubs();
    assert.end();
  });

  t.test('The event callbacks should work as expected - If we end up removing the listeners for SDK_READY, it behaves as if it had none', assert => {
    statusManager(contextMock);

    // Get the callbacks
    const readyEventCB = gateMock.once.getCall(2).args[1];
    const removeListenerCB = gateMock.on.getCall(0).args[1];
    const addListenerCB = gateMock.on.getCall(1).args[1];

    // Fake adding two listeners
    addListenerCB(gateMock.SDK_READY);
    addListenerCB(gateMock.SDK_READY);

    // And then fake remove only one of them. The rest are events that we don't care about so it should not affect the count.
    removeListenerCB(gateMock.SDK_READY);
    removeListenerCB(gateMock.SDK_READY_TIMED_OUT);
    removeListenerCB('random event');

    readyEventCB();
    assert.false(loggerMock.warn.called, 'No warning when the SDK is ready as we still have one listener.');

    resetStubs();
    assert.end();
  });
});

tape('Readiness Callbacks handler - Ready promise', t => {
  const gateMock = {
    on: sinon.stub(),
    once: sinon.stub(),
    SDK_READY: 'sdk_ready_event',
    SDK_READY_TIMED_OUT: 'sdk_ready_timeout_event',
    SDK_UPDATE: 'sdk_update',
  };
  const contextMock = {
    put: sinon.stub(),
    get: entityName => entityName === 'readiness_gate' ? { gate: gateMock } : null,
    constants: {
      READINESS: 'readiness_gate'
    }
  };
  function resetStubs() {
    contextMock.put.resetHistory();
    gateMock.on.resetHistory();
    gateMock.once.resetHistory();
    loggerMock.warn.resetHistory();
    loggerMock.error.resetHistory();
  }

  t.test('.ready() promise behaviour for shared clients', async assert => {
    const statusInterfaceForShared = statusManager(contextMock, true);
    const readyForShared = statusInterfaceForShared.ready();

    assert.true(readyForShared instanceof Promise, 'It should return a promise.');

    await readyForShared.then(
      () => {
        assert.pass('It should be a promise that was resolved already.');
        resetStubs();
        assert.end();
      },
      () => assert.fail('It should be a promise that was resolved already, not rejected.')
    );
  });

  t.test('.ready() promise behaviour for main clients', async assert => {
    const statusInterface = statusManager(contextMock); // Default is regular clients, no bool flag
    const ready = statusInterface.ready();

    assert.true(ready instanceof Promise, 'It should return a promise.');

    // Get the callback
    const readyEventCB = gateMock.once.getCall(0).args[1];

    readyEventCB(); // make the SDK "ready", to assert that ready promise is resolved

    let testPassed = false;
    await ready.then(
      () => {
        assert.pass('It should be a promise that will be resolved when the SDK is ready.');
        resetStubs();
        testPassed = true;
      },
      () => assert.fail('It should be resolved on ready event, not rejected.')
    );

    // control assertion. stubs already reset.
    assert.true(testPassed);

    const statusInterfaceForTimedout = statusManager(contextMock); // Default is regular clients, no bool flag

    // Get the callback
    const timedoutEventCB = gateMock.once.getCall(1).args[1];
    const sdkReadyEventCB = gateMock.once.getCall(2).args[1];

    const readyForTimeout = statusInterfaceForTimedout.ready();

    timedoutEventCB(); // make the SDK "timed out", to assert that ready promise is rejected

    await readyForTimeout.then(
      () => assert.fail('It should be a promise that was rejected on SDK_READY_TIMED_OUT, not resolved.'),
      () => {
        assert.pass('It should be a promise that will be rejected when the SDK is timed out.');
      }
    );

    sdkReadyEventCB(); // make the SDK "ready" after "timed out", to assert that ready promise is now resolved

    const readyForSdkReady = statusInterfaceForTimedout.ready();  

    await readyForSdkReady.then(
      () => {
        assert.pass('It should be a promise that is inmediatelly resolved, since the SDK is ready.');
        resetStubs();
        assert.end();
      },
      () => assert.fail('It should be resolved on ready event, not rejected.')
    );
  });

  t.test('Full blown ready promise count as a callback and resolves on SDK_READY', assert => {
    const statusInterface = statusManager(contextMock);
    const readyPromise = statusInterface.ready();
    const sdkReadyCallback = gateMock.once.getCall(2).args[1];
    const readyEventCB = gateMock.once.getCall(0).args[1];

    sdkReadyCallback(assert);
    assert.true(loggerMock.warn.calledOnceWithExactly('No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.'), 'We would get the warning if the SDK get\'s ready before attaching any callbacks to ready promise.');
    loggerMock.warn.resetHistory();

    readyPromise.then(() => {
      assert.pass('The ready promise is resolved when the gate emits SDK_READY.');
      resetStubs();
      assert.end();
    }, () => {
      assert.fail('This should not be called as the promise is being resolved.');
      resetStubs();
      assert.end();
    });

    sdkReadyCallback();
    assert.false(loggerMock.warn.called, 'But if we have a listener there are no warnings.');

    // Resolve the promise, this would be called by the gate when SDK_READY is emitted.
    readyEventCB();
  });
});
