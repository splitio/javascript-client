import proxyquire from 'proxyquire';
import tape from 'tape-catch';
import sinon from 'sinon';
const proxyquireStrict = proxyquire.noCallThru();

const contextMock = {
  get: sinon.stub(),
  constants: { DESTROYED: 'is_destroyed', READY: 'is_ready', READY_FROM_CACHE: 'is_ready_from_cache' }
};
const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
const { validateIfDestroyed, validateIfReady } = proxyquireStrict('../../inputValidation/isOperational', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  contextMock.get.reset();
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

tape('INPUT VALIDATION for the state of the client/factory', t => {
  t.test('validateIfDestroyed - Should return true if the client/factory evaluates as operational (not destroyed).', assert => {
    contextMock.get.returns(false);

    assert.true(validateIfDestroyed(contextMock), 'It should return true if the client is operational (it is NOT destroyed).');
    assert.true(contextMock.get.calledOnceWithExactly(contextMock.constants.DESTROYED, true), 'It checks for destroyed status using the context.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'Should not log any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('validateIfDestroyed - Should return false and log error if attributes map is invalid', assert => {
    contextMock.get.returns(true);

    assert.false(validateIfDestroyed(contextMock), 'It should return false if the client is NOT operational (it is destroyed).');
    assert.true(contextMock.get.calledOnceWithExactly(contextMock.constants.DESTROYED, true), 'It checks for destroyed status using the context.');
    assert.ok(loggerMock.error.calledOnceWithExactly('Client has already been destroyed - no calls possible.'), 'Should log an error.');
    assert.notOk(loggerMock.warn.called, 'But it should not log any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('validateIfReady - Should return true and log nothing if the SDK was ready.', assert => {
    contextMock.get.withArgs(contextMock.constants.READY).returns(true);
    contextMock.get.withArgs(contextMock.constants.READY_FROM_CACHE).returns(false);

    assert.true(validateIfReady(contextMock, 'test_method'), 'It should return true if SDK was ready.');
    assert.true(contextMock.get.calledOnceWithExactly(contextMock.constants.READY, true), 'It checks for readiness status using the context.');
    assert.notOk(loggerMock.warn.called, 'But it should not log any warnings.');
    assert.notOk(loggerMock.error.called, 'But it should not log any errors.');

    resetStubs();
    assert.end();
  });

  t.test('validateIfReady - Should return true and log nothing if the SDK was ready from cache.', assert => {
    contextMock.get.withArgs(contextMock.constants.READY).returns(false);
    contextMock.get.withArgs(contextMock.constants.READY_FROM_CACHE).returns(true);

    assert.true(validateIfReady(contextMock, 'test_method'), 'It should return true if SDK was ready.');
    assert.true(contextMock.get.calledTwice, 'It checks for readiness status using the context.');
    assert.true(contextMock.get.calledWithExactly(contextMock.constants.READY, true), 'It checks for SDK_READY status.');
    assert.true(contextMock.get.calledWithExactly(contextMock.constants.READY_FROM_CACHE, true), 'It checks for SDK_READY_FROM_CACHE status.');    assert.notOk(loggerMock.warn.called, 'But it should not log any warnings.');
    assert.notOk(loggerMock.error.called, 'But it should not log any errors.');

    resetStubs();
    assert.end();
  });

  t.test('validateIfReady - Should return false and log a warning if the SDK was not ready.', assert => {
    contextMock.get.returns(false);

    assert.false(validateIfReady(contextMock, 'test_method'), 'It should return true if SDK was ready.');
    assert.true(contextMock.get.calledTwice, 'It checks for readiness status using the context.');
    assert.true(contextMock.get.calledWithExactly(contextMock.constants.READY, true), 'It checks for SDK_READY status.');
    assert.true(contextMock.get.calledWithExactly(contextMock.constants.READY_FROM_CACHE, true), 'It checks for SDK_READY_FROM_CACHE status.');
    assert.ok(loggerMock.warn.calledOnceWithExactly('test_method: the SDK is not ready, results may be incorrect. Make sure to wait for SDK readiness before using this method.'), 'It should log the expected warning.');
    assert.notOk(loggerMock.error.called, 'But it should not log any errors.');

    resetStubs();
    assert.end();
  });
});
