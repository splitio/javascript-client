import tape from 'tape-catch';
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
const validateValue = proxyquireStrict('../../inputValidation/eventValue', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

const invalidValues = [
  [],
  () => {},
  false,
  true,
  {},
  Object.create({}),
  'something',
  NaN,
  -Infinity,
  Infinity,
  new Promise(res => res),
  Symbol('asd'),
  null,
  undefined
];

tape('INPUT VALIDATION for Event Values', t => {
  t.test('Should return the passed value if it is a valid finite number without logging any errors', assert => {
    assert.equal(validateValue(50, 'some_method_eventValue'), 50, 'It should return the passed number if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.equal(validateValue(-50, 'some_method_eventValue'), -50, 'It should return the passed number if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');

    resetStubs();
    assert.end();
  });

  t.test('Should return false and log error if event value is not a valid finite number', assert => {
    for (let i = 0; i < invalidValues.length; i++) {
      const invalidValue = invalidValues[i];

      assert.equal(validateValue(invalidValue, 'test_method'), false, 'Invalid event values should always return false.');
      assert.ok(loggerMock.error.calledWithExactly('test_method: value must be a finite number.'), 'Should log the error for the invalid event value.');

      loggerMock.error.resetHistory();
    }

    resetStubs();
    assert.end();
  });
});
