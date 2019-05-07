import proxyquire from 'proxyquire';
import tape from 'tape-catch';
import sinon from 'sinon';
const proxyquireStrict = proxyquire.noCallThru();

const contextMock = {
  get: sinon.stub(),
  constants: { DESTROYED: 'is_destroyed' }
};
const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
const { validateIfOperational } = proxyquireStrict('../../inputValidation/isOperational', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

tape('INPUT VALIDATION for the state of the client/factory', t => {
  t.test('Should return true if the client/factory evaluates as operational.', assert => {
    contextMock.get.returns(false);

    assert.true(validateIfOperational(contextMock), 'It should return true if the client is operational.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'Should not log any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('Should return false and log error if attributes map is invalid', assert => {
    contextMock.get.returns(true);

    assert.false(validateIfOperational(contextMock), 'It should return false if the client is NOT operational.');
    assert.ok(loggerMock.error.calledWithExactly('Client has already been destroyed - no calls possible.'), 'Should log an error.');
    assert.notOk(loggerMock.warn.called, 'But it should not log any warnings.');

    resetStubs();
    assert.end();
  });
});
