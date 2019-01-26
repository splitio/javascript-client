/* eslint-disable no-console */
import tape from 'tape-catch';
import sinon from 'sinon';
import { API as LoggerAPI } from '../../logger';
import validateKey from '../../inputValidation/key';

const isNode = typeof process !== 'undefined' && process.version ? true : false;

const errorMsgs = {
  EMPTY_KEY: keyType => `you passed an empty string, ${keyType} must be a non-empty string.`,
  LONG_KEY: keyType => `${keyType} too long, ${keyType} must be 250 characters or less.`,
  NULL_KEY: keyType => `you passed a null or undefined ${keyType}, ${keyType} must be a non-empty string.`,
  WRONG_TYPE_KEY: keyType => `you passed an invalid ${keyType} type, ${keyType} must be a non-empty string.`,
  NUMERIC_KEY: (keyType, value) => `${keyType} "${value}" is not of type string, converting.`,
  WRONG_KEY_PROPS: 'Key must be an object with bucketingKey and matchingKey with valid string properties.'
};

const invalidKeys = [
  { key: '', msg: errorMsgs.EMPTY_KEY },
  { key: 'a'.repeat(251), msg: errorMsgs.LONG_KEY },
  { key: null, msg: errorMsgs.NULL_KEY },
  { key: undefined, msg: errorMsgs.NULL_KEY },
  { key: () => {}, msg: errorMsgs.WRONG_TYPE_KEY },
  { key: new Promise(r => r()), msg: errorMsgs.WRONG_TYPE_KEY },
  { key: Symbol('asd'), msg: errorMsgs.WRONG_TYPE_KEY },
  { key: [], msg: errorMsgs.WRONG_TYPE_KEY },
  { key: true, msg: errorMsgs.WRONG_TYPE_KEY },
  { key: NaN, msg: errorMsgs.WRONG_TYPE_KEY },
  { key: Infinity, msg: errorMsgs.WRONG_TYPE_KEY },
  { key: -Infinity, msg: errorMsgs.WRONG_TYPE_KEY },
];

const stringifyableKeys = [
  { key: 200, msg: errorMsgs.NUMERIC_KEY },
  { key: 1235891238571295, msg: errorMsgs.NUMERIC_KEY },
  { key: 0, msg: errorMsgs.NUMERIC_KEY }
];

const invalidKeyObjects = [
  {},
  { matchingKey: 'asd' },
  { bucketingKey: 'asd' },
  { key: 'asd', bucketingKey: 'asdf' },
  { random: 'asd' }
];

tape('INPUT VALIDATION - String key / Should return false and log error if key is invalid', assert => {
  const consoleMethod = !isNode ? 'error' : 'log';

  // Spy on the console method that will be used.
  console[consoleMethod] && sinon.spy(console, consoleMethod);

  for (let i = 0; i < invalidKeys.length; i++) {
    const invalidKey = invalidKeys[i]['key'];
    const expectedLog = invalidKeys[i]['msg']('key');

    assert.equal(validateKey(invalidKey, 'test_method'), false, 'Invalid keys should return false.');
    assert.ok(console.log.calledWithMatch(`[ERROR] test_method: ${expectedLog}`), 'The error should be logged for the invalid key.');

    console[consoleMethod].reset();
  }
  // Restore spy.
  console[consoleMethod].restore();

  assert.end();
});

tape('INPUT VALIDATION - String key / Should return stringified version of the key if it is convertible to one and log a warning.', assert => {
  // Spy on the console log method
  sinon.spy(console, 'log');

  for (let i = 0; i < stringifyableKeys.length; i++) {
    const invalidKey = stringifyableKeys[i]['key'];
    const expectedLog = stringifyableKeys[i]['msg']('key', invalidKey);

    assert.equal(validateKey(invalidKey, 'test_method'), String(invalidKey), 'Stringifyable keys should be transformed to string and returned.');
    assert.notOk(console.log.calledWithMatch(`[WARN] test_method: ${expectedLog}`), 'The warning should not be logged by default for the invalid key.');

    // Allow for warnings to be shown.
    LoggerAPI.setLogLevel(LoggerAPI.LogLevel.WARN);

    validateKey(invalidKey, 'test_method');
    assert.ok(console.log.calledWithMatch(`[WARN]  test_method: ${expectedLog}`), 'But if the logger allows for warnings, it should be logged.');

    // Allow for warnings to be shown.
    LoggerAPI.disable();

    console.log.reset();
  }

  // Restore spy.
  console.log.restore();

  assert.end();
});

tape('INPUT VALIDATION - Object key / Should return false and log error if key is invalid', assert => {
  const consoleMethod = !isNode ? 'error' : 'log';

  // Spy on the console method that will be used.
  sinon.spy(console, consoleMethod);

  for (let i = 0; i < invalidKeyObjects.length; i++) {
    assert.equal(validateKey(invalidKeyObjects[i], 'test_method'), false, 'Invalid keys should return false.');
    assert.ok(console.log.calledWithMatch(`[ERROR] test_method: ${errorMsgs.WRONG_KEY_PROPS}`), 'The error should be logged for the invalid key.');

    console[consoleMethod].reset();
  }

  for (let i = 0; i < invalidKeys.length; i++) {
    const invalidKey = invalidKeys[i]['key'];
    const expectedLog = invalidKeys[i]['msg']('key');

    assert.equal(validateKey(invalidKey, 'test_method'), false, 'Invalid keys should return false.');
    assert.ok(console.log.calledWithMatch(`[ERROR] test_method: ${expectedLog}`), 'The error should be logged for the invalid key.');

    console[consoleMethod].reset();
  }

  // Restore spy.
  console[consoleMethod].restore();

  assert.end();
});
