/* eslint-disable no-console */
import tape from 'tape-catch';
import sinon from 'sinon';
import validateSplit from '../../inputValidation/split';
import { API as LoggerAPI } from '../../logger';

const isNode = typeof process !== 'undefined' && process.version ? true : false;

const errorMsgs = {
  NULL_SPLIT: () => 'you passed a null or undefined split name, split name must be a non-empty string.',
  WRONG_TYPE_SPLIT: () => 'you passed an invalid split name, split name must be a non-empty string.',
  EMPTY_SPLIT: () => 'you passed an empty split name, split name must be a non-empty string.',
  TRIMMABLE_SPLIT: splitName => `split name "${splitName}" has extra whitespace, trimming.`
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

tape('INPUT VALIDATION for Split names', t => {
  t.test('Should return the provided split name if it is a valid string without logging any errors', assert => {
    const consoleMethod = !isNode ? 'error' : 'log';
    // Spy on the console method that will be used.
    console[consoleMethod] && sinon.spy(console, consoleMethod);

    assert.equal(validateSplit('splitName', 'some_method_splitName'), 'splitName', 'It should return the provided string if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_splitName'), 'Should not log any errors.');
    assert.equal(validateSplit('split_name', 'some_method_splitName'), 'split_name', 'It should return the provided string if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_splitName'), 'Should not log any errors.');
    assert.equal(validateSplit('A_split-name_29', 'some_method_splitName'), 'A_split-name_29', 'It should return the provided string if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_splitName'), 'Should not log any errors.');

    console[consoleMethod].restore();

    assert.end();
  });

  t.test('Should trim split name if it is a valid string with trimmable spaces and log a warning (if those are enabled)', assert => {
    sinon.spy(console, 'log');

    // Enable warning logs
    LoggerAPI.setLogLevel(LoggerAPI.LogLevel.WARN);

    for (let i = 0; i < trimmableSplits.length; i++) {
      const trimmableSplit = trimmableSplits[i];
      assert.equal(validateSplit(trimmableSplit, 'some_method_splitName'), trimmableSplit.trim(), 'It should return the trimmed version of the split name received.');
      assert.ok(console.log.calledWithMatch(`[WARN]  some_method_splitName: ${errorMsgs.TRIMMABLE_SPLIT(trimmableSplit)}`), 'Should log a warning if those are enabled');
    }

    LoggerAPI.disable();
    console.log.restore();

    assert.end();
  });

  t.test('Should return false and log error if split name is not a valid string', assert => {
    const consoleMethod = !isNode ? 'error' : 'log';
    console[consoleMethod] && sinon.spy(console, consoleMethod);

    for (let i = 0; i < invalidSplits.length; i++) {
      const invalidValue = invalidSplits[i]['split'];
      const expectedLog = invalidSplits[i]['msg'](invalidValue);

      assert.equal(validateSplit(invalidValue, 'test_method'), false, 'Invalid event types should always return false.');
      assert.ok(console[consoleMethod].calledWithMatch(`[ERROR] test_method: ${expectedLog}`), 'Should log the error for the invalid event type.');

      console[consoleMethod].resetHistory();
    }

    console[consoleMethod].restore();

    assert.end();
  });
});
