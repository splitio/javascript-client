import tape from 'tape-catch';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();
import * as LabelConstants from '../../labels';

const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
const { validateSplit, validateSplitExistance } = proxyquireStrict('../../inputValidation/split', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

const errorMsgs = {
  NULL_SPLIT: () => 'you passed a null or undefined split name, split name must be a non-empty string.',
  WRONG_TYPE_SPLIT: () => 'you passed an invalid split name, split name must be a non-empty string.',
  EMPTY_SPLIT: () => 'you passed an empty split name, split name must be a non-empty string.',
  TRIMMABLE_SPLIT: splitName => `split name "${splitName}" has extra whitespace, trimming.`,
  NOT_EXISTENT_SPLIT: splitName => `you passed "${splitName}" that does not exist in this environment, please double check what Splits exist in the web console.`
};

const invalidSplits = [
  { split: [], msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: () => {}, msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: Object.create({}), msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: {}, msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: true, msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: false, msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: 10, msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: 0, msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: NaN, msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: Infinity, msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: null, msg: errorMsgs.NULL_SPLIT },
  { split: undefined, msg: errorMsgs.NULL_SPLIT },
  { split: new Promise(res => res), msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: Symbol('asd'), msg: errorMsgs.WRONG_TYPE_SPLIT },
  { split: '', msg: errorMsgs.EMPTY_SPLIT }
];

const trimmableSplits = [
  '  splitName  ',
  'split_name2   \n  ',
  ' split_name3'
];

tape('INPUT VALIDATION for Split name and Split existance (special case)', t => {
  t.test('Should return the provided split name if it is a valid string without logging any errors', assert => {
    assert.equal(validateSplit('splitName', 'some_method_splitName'), 'splitName', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.calledWithExactly('some_method_splitName'), 'Should not log any errors.');
    assert.equal(validateSplit('split_name', 'some_method_splitName'), 'split_name', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.calledWithExactly('some_method_splitName'), 'Should not log any errors.');
    assert.equal(validateSplit('A_split-name_29', 'some_method_splitName'), 'A_split-name_29', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.calledWithExactly('some_method_splitName'), 'Should not log any errors.');

    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('Should trim split name if it is a valid string with trimmable spaces and log a warning (if those are enabled)', assert => {
    for (let i = 0; i < trimmableSplits.length; i++) {
      const trimmableSplit = trimmableSplits[i];
      assert.equal(validateSplit(trimmableSplit, 'some_method_splitName'), trimmableSplit.trim(), 'It should return the trimmed version of the split name received.');
      assert.ok(loggerMock.warn.calledWithExactly(`some_method_splitName: ${errorMsgs.TRIMMABLE_SPLIT(trimmableSplit)}`), 'Should log a warning if those are enabled.');

      loggerMock.warn.resetHistory();
    }

    assert.notOk(loggerMock.error.called, 'It should have not logged any errors.');

    resetStubs();
    assert.end();
  });

  t.test('Should return false and log error if split name is not a valid string', assert => {
    for (let i = 0; i < invalidSplits.length; i++) {
      const invalidValue = invalidSplits[i]['split'];
      const expectedLog = invalidSplits[i]['msg'](invalidValue);

      assert.equal(validateSplit(invalidValue, 'test_method'), false, 'Invalid event types should always return false.');
      assert.ok(loggerMock.error.calledWithExactly(`test_method: ${expectedLog}`), 'Should log the error for the invalid event type.');

      loggerMock.error.resetHistory();
    }

    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('Should return a boolean indicating if the SDK was ready and there was no Split object or "definition not found" label', assert => {
    const contextMock = {
      get: sinon.stub().returns(false), // Fake the signal for the non ready SDK
      constants: {
        READY: 'is_ready'
      }
    };

    assert.true(validateSplitExistance(contextMock, 'some_split', {}, 'test_method'), 'Should always return true when the SDK is not ready.');
    assert.true(validateSplitExistance(contextMock, 'some_split', null, 'test_method'), 'Should always return true when the SDK is not ready.');
    assert.true(validateSplitExistance(contextMock, 'some_split', undefined, 'test_method'), 'Should always return true when the SDK is not ready.');
    assert.true(validateSplitExistance(contextMock, 'some_split', 'a label', 'test_method'), 'Should always return true when the SDK is not ready.');
    assert.true(validateSplitExistance(contextMock, 'some_split', LabelConstants.SPLIT_NOT_FOUND, 'test_method'), 'Should always return true when the SDK is not ready.');

    assert.false(loggerMock.warn.called, 'There should have been no warning logs since the SDK was not ready yet.');
    assert.false(loggerMock.error.called, 'There should have been no error logs since the SDK was not ready yet.');

    // Prepare the mock to fake that the SDK is ready now.
    contextMock.get.returns(true);

    assert.true(validateSplitExistance(contextMock, 'other_split', {}, 'other_method'), 'Should return true if it receives a Split Object instead of null (when the object is not found, for manager).');
    assert.true(validateSplitExistance(contextMock, 'other_split', 'a label', 'other_method'), 'Should return true if it receives a Label and it is not split not found (when the Split was not found on the storage, for client).');

    assert.false(loggerMock.warn.called, 'There should have been no warning logs since the values we used so far were considered valid.');
    assert.false(loggerMock.error.called, 'There should have been no error logs since the values we used so far were considered valid.');

    assert.false(validateSplitExistance(contextMock, 'other_split', null, 'other_method'), 'Should return false if it receives a non-truthy value as a split object or label');
    assert.false(validateSplitExistance(contextMock, 'other_split', undefined, 'other_method'), 'Should return false if it receives a non-truthy value as a split object or label');
    assert.false(validateSplitExistance(contextMock, 'other_split', LabelConstants.SPLIT_NOT_FOUND, 'other_method'), 'Should return false if it receives a label but it is the split not found one.');

    assert.equal(loggerMock.warn.callCount, 3, 'It should have logged 3 warnings, one per each time we called it');
    assert.true(loggerMock.warn.alwaysCalledWithExactly(`other_method: ${errorMsgs.NOT_EXISTENT_SPLIT('other_split')}`), 'Warning logs should have the correct message.');

    assert.false(loggerMock.error.called, 'We log warnings, not errors.');

    resetStubs();
    assert.end();
  });
});
