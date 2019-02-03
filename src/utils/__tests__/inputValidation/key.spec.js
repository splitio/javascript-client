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
const { validateKey } = proxyquireStrict('../../inputValidation/key', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

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

tape('INPUT VALIDATION for Key', t => {
  t.test('String and Object keys / Should return the key with no errors logged if the key is correct', assert => {
    const validKey = 'validKey';
    const validObjKey = {
      matchingKey: 'valid', bucketingKey: 'alsoValid'
    };

    assert.deepEqual(validateKey(validKey, 'some_method_keys'), validKey, 'It will return the valid key.');
    assert.notOk(loggerMock.error.called, 'No errors should be logged.');

    assert.deepEqual(validateKey(validObjKey, 'some_method_keys'), validObjKey, 'It will return the valid key.');
    assert.notOk(loggerMock.error.called, 'No errors should be logged.');

    resetStubs();
    assert.end();
  });

  t.test('String key / Should return false and log error if key is invalid', assert => {
    for (let i = 0; i < invalidKeys.length; i++) {
      const invalidKey = invalidKeys[i]['key'];
      const expectedLog = invalidKeys[i]['msg']('key');

      assert.equal(validateKey(invalidKey, 'test_method'), false, 'Invalid keys should return false.');
      assert.ok(loggerMock.error.calledWithExactly(`test_method: ${expectedLog}`), 'The error should be logged for the invalid key.');

      loggerMock.error.resetHistory();
    }

    resetStubs();
    assert.end();
  });

  t.test('String key / Should return stringified version of the key if it is convertible to one and log a warning.', assert => {
    for (let i = 0; i < stringifyableKeys.length; i++) {
      const invalidKey = stringifyableKeys[i]['key'];
      const expectedLog = stringifyableKeys[i]['msg']('key', invalidKey);

      validateKey(invalidKey, 'test_method');
      assert.ok(loggerMock.warn.calledWithExactly(`test_method: ${expectedLog}`), 'But if the logger allows for warnings, it should be logged.');

      loggerMock.warn.resetHistory();
    }

    resetStubs();
    assert.end();
  });

  t.test('Object key / Should return false and log error if a part of the key is invalid', assert => {
    // Test invalid object format
    for (let i = 0; i < invalidKeyObjects.length; i++) {
      assert.equal(validateKey(invalidKeyObjects[i], 'test_method'), false, 'Invalid key objects should return false.');
      assert.ok(loggerMock.error.calledWithExactly(`test_method: ${errorMsgs.WRONG_KEY_PROPS}`), 'The error should be logged for the invalid key.');

      loggerMock.error.resetHistory();
    }

    resetStubs();
    // Test invalid matchingKey
    for (let i = 0; i < invalidKeys.length; i++) {
      const invalidKey = {
        matchingKey: invalidKeys[i]['key'],
        bucketingKey: 'thisIsValid'
      };
      const expectedLog = invalidKeys[i]['msg']('matchingKey');

      assert.equal(validateKey(invalidKey, 'test_method'), false, 'Invalid keys should return false.');
      assert.ok(loggerMock.error.calledWithExactly(`test_method: ${expectedLog}`), 'The error should be logged for the invalid key.');

      loggerMock.error.resetHistory();
    }
    resetStubs();

    // Test invalid bucketingKey
    for (let i = 0; i < invalidKeys.length; i++) {
      const invalidKey = {
        matchingKey: 'thisIsValidToo',
        bucketingKey: invalidKeys[i]['key']
      };
      const expectedLog = invalidKeys[i]['msg']('bucketingKey');

      assert.equal(validateKey(invalidKey, 'test_method'), false, 'Invalid keys should return false.');
      assert.ok(loggerMock.error.calledWithExactly(`test_method: ${expectedLog}`), 'The error should be logged for the invalid key.');

      loggerMock.error.resetHistory();
    }
    resetStubs();

    // Just one test that if both are invalid we get the log for both.
    let invalidKey = {
      matchingKey:  invalidKeys[0]['key'],
      bucketingKey: invalidKeys[1]['key']
    };
    let expectedLogMK = invalidKeys[0]['msg']('matchingKey');
    let expectedLogBK = invalidKeys[1]['msg']('bucketingKey');

    assert.equal(validateKey(invalidKey, 'test_method'), false, 'Invalid keys should return false.');
    assert.ok(loggerMock.error.calledWithExactly(`test_method: ${expectedLogMK}`), 'The error should be logged for the invalid key property.');
    assert.ok(loggerMock.error.calledWithMatch(`test_method: ${expectedLogBK}`), 'The error should be logged for the invalid key property.');

    resetStubs();
    assert.end();
  });

  t.test('Object key / Should return stringified version of the key props if those are convertible and log the corresponding warnings', assert => {
    let invalidKey = {
      matchingKey:  stringifyableKeys[0]['key'],
      bucketingKey: stringifyableKeys[1]['key']
    };
    let expectedKey = {
      matchingKey: String(invalidKey.matchingKey),
      bucketingKey: String(invalidKey.bucketingKey),
    };
    let expectedLogMK = stringifyableKeys[0]['msg']('matchingKey', invalidKey.matchingKey);
    let expectedLogBK = stringifyableKeys[1]['msg']('bucketingKey', invalidKey.bucketingKey);

    assert.deepEqual(validateKey(invalidKey, 'test_method'), expectedKey, 'If a key object had stringifyable values, those will be stringified and Key returned.');
    assert.ok(loggerMock.warn.calledWithExactly(`test_method: ${expectedLogMK}`), 'The warning should be logged for the stringified prop if warnings are enabled.');
    assert.ok(loggerMock.warn.calledWithExactly(`test_method: ${expectedLogBK}`), 'The warning should be logged for the stringified prop if warnings are enabled.');

    resetStubs();
    assert.end();
  });
});
