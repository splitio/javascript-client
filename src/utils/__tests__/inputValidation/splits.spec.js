import proxyquire from 'proxyquire';
import tape from 'tape-catch';
import sinon from 'sinon';
import uniq from 'lodash/uniq';
import startsWith from 'lodash/startsWith';
const proxyquireStrict = proxyquire.noCallThru();

const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
const validateSplitValue = sinon.stub().returnsArg(0);
const validateSplits = proxyquireStrict('../../inputValidation/splits', {
  '../logger': LogFactoryMock,
  './split': validateSplitValue
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
  validateSplitValue.resetHistory();
}

const invalidSplits = [
  [],
  {},
  Object.create({}),
  () => {},
  false,
  true,
  5,
  'something',
  NaN,
  -Infinity,
  new Promise(res => res),
  Symbol('asd'),
  null,
  undefined,
  NaN
];

tape('INPUT VALIDATION for Split names', t => {
  t.test('Should return the provided array if it is a valid splits names array without logging any errors', assert => {
    const validArr = ['splitName1', 'split_name_2', 'split-name-3'];

    assert.deepEqual(validateSplits(validArr, 'some_method_splits'), validArr, 'It should return the provided array without changes if it is valid.');
    assert.equal(validateSplitValue.callCount, validArr.length, 'Should have validated each value independently.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors on the collection.');

    resetStubs();
    assert.end();
  });

  t.test('Should return the provided array if it is a valid splits names array removing duplications, without logging any errors', assert => {
    const validArr = ['split_name', 'split_name', 'split-name'];

    assert.deepEqual(validateSplits(validArr, 'some_method_splits'), uniq(validArr), 'It should return the provided array without changes if it is valid.');
    assert.equal(validateSplitValue.callCount, validArr.length, 'Should have validated each value independently.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors on the collection.');

    resetStubs();
    assert.end();
  });

  t.test('Should return false and log an error for the array if it is invalid', assert => {
    for (let i = 0; i < invalidSplits.length; i++) {
      assert.false(validateSplits(invalidSplits[i], 'test_method'), 'It will return false as the array is of an incorrect type.');
      assert.ok(loggerMock.error.calledOnceWithExactly('test_method: split_names must be a non-empty array.'), 'Should log the error for the collection.');
      assert.false(validateSplitValue.called, 'Should not try to validate any inner value if there is no valid array.');

      loggerMock.error.resetHistory();
    }

    resetStubs();
    assert.end();
  });

  t.test('Should strip out any invalid value from the array', assert => {
    validateSplitValue.resetBehavior();
    // We use a mock function for individual validation.
    validateSplitValue.callsFake(value => startsWith(value, 'invalid') ? false : value);
    const myArr = ['valid_name', 'invalid_name', 'invalid_val_2', 'something_valid'];

    assert.deepEqual(validateSplits(myArr, 'test_method'), ['valid_name', 'something_valid'], 'It will return the array without the invalid values.');

    for (let i = 0; i < myArr.length; i++) {
      assert.true(validateSplitValue.calledWithExactly(myArr[i]), 'Should validate any inner value independently.');
    }

    assert.false(loggerMock.error.called, 'Should not log any error for the collection.');

    resetStubs();
    assert.end();
  });
});
