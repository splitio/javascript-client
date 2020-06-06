import proxyquire from 'proxyquire';
import tape from 'tape-catch';
import sinon from 'sinon';

const proxyquireStrict = proxyquire.noCallThru().noPreserveCache();

const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
const { validateApiKey } = proxyquireStrict('../../inputValidation/apiKey', {
  '../logger': LogFactoryMock
});

// Since this module keeps an internal cache, we reload it.
const apiKeyValidator2 = proxyquireStrict('../../inputValidation/apiKey', {
  '../logger': LogFactoryMock
});
const apiKeyValidator3 = proxyquireStrict('../../inputValidation/apiKey', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

const errorMsgs = {
  WRONG_TYPE_API_KEY: 'Factory instantiation: you passed an invalid api_key, api_key must be a non-empty string.',
  EMPTY_API_KEY: 'Factory instantiation: you passed an empty api_key, api_key must be a non-empty string.',
  NULL_API_KEY: 'Factory instantiation: you passed a null or undefined api_key, api_key must be a non-empty string.'
};

const invalidKeys = [
  { key: '', msg: errorMsgs.EMPTY_API_KEY },
  { key: null, msg: errorMsgs.NULL_API_KEY },
  { key: undefined, msg: errorMsgs.NULL_API_KEY },
  { key: () => {}, msg: errorMsgs.WRONG_TYPE_API_KEY },
  { key: new Promise(r => r()), msg: errorMsgs.WRONG_TYPE_API_KEY },
  { key: Symbol('asd'), msg: errorMsgs.WRONG_TYPE_API_KEY },
  { key: [], msg: errorMsgs.WRONG_TYPE_API_KEY },
  { key: true, msg: errorMsgs.WRONG_TYPE_API_KEY },
  { key: NaN, msg: errorMsgs.WRONG_TYPE_API_KEY },
  { key: Infinity, msg: errorMsgs.WRONG_TYPE_API_KEY },
  { key: -Infinity, msg: errorMsgs.WRONG_TYPE_API_KEY },
  { key: {}, msg: errorMsgs.WRONG_TYPE_API_KEY }
];

tape('INPUT VALIDATION for Api Keys', t => {
  t.test('Should return the passed api key if it is a valid string without logging any errors', assert => {
    const validApiKey = 'qjok3snti4dgsticade5hfphmlucarsflv14';

    assert.equal(validateApiKey(validApiKey), validApiKey, 'It should return the passed string if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');

    resetStubs();
    assert.end();
  });

  t.test('Should return false and log error if the api key is invalid', assert => {
    for (let i = 0; i < invalidKeys.length; i++) {
      const invalidApiKey = invalidKeys[i]['key'];
      const expectedLog = invalidKeys[i]['msg'];

      assert.equal(validateApiKey(invalidApiKey), false, 'Invalid strings should return false.');
      assert.ok(loggerMock.error.calledWithExactly(expectedLog), 'The error should be logged for the invalid string.');

      loggerMock.error.resetHistory();
    }

    resetStubs();
    assert.end();
  });

  t.test('Should log a warning if we are instantiating more than one factory (different api keys)', assert => {
    const validApiKey1 = 'qjok3snti4dgsticade5hfphmlucarsflv14';
    const validApiKey2 = 'qjok3snti4dgsticade5hfphmlucars92uih';
    const validApiKey3 = '84ynbsnti4dgsticade5hfphmlucars92uih';

    assert.equal(apiKeyValidator2.validateApiKey(validApiKey1), validApiKey1);
    assert.false(loggerMock.warn.called, 'If this is the first api key we are registering, there is no warning.');

    assert.equal(apiKeyValidator2.validateApiKey(validApiKey2), validApiKey2);
    assert.true(loggerMock.warn.calledOnceWithExactly('Factory instantiation: You already have an instance of the Split factory. Make sure you definitely want this additional instance. We recommend keeping only one instance of the factory at all times (Singleton pattern) and reusing it throughout your application.'), 'We register a new api key, we get a warning.');

    assert.equal(apiKeyValidator2.validateApiKey(validApiKey3), validApiKey3);
    assert.true(loggerMock.warn.calledWithExactly('Factory instantiation: You already have an instance of the Split factory. Make sure you definitely want this additional instance. We recommend keeping only one instance of the factory at all times (Singleton pattern) and reusing it throughout your application.'), 'We register a new api key, we get a warning.');

    // We will release the used keys and expect no warnings next time.
    apiKeyValidator2.releaseApiKey(validApiKey1);
    apiKeyValidator2.releaseApiKey(validApiKey2);
    apiKeyValidator2.releaseApiKey(validApiKey3);

    resetStubs();

    assert.equal(apiKeyValidator2.validateApiKey(validApiKey1), validApiKey1);
    assert.false(loggerMock.warn.called, 'If all the keys were released and we try again, there is no warning.');

    resetStubs();
    assert.end();
  });

  t.test('Should log a warning if we are instantiating more than one factory (same api key)', assert => {
    const validApiKey = '84ynbsnti4dgsticade5hfphmlucars92uih';

    assert.equal(apiKeyValidator3.validateApiKey(validApiKey), validApiKey);
    assert.false(loggerMock.warn.called, 'If this is the first api key we are registering, there is no warning.');

    assert.equal(apiKeyValidator3.validateApiKey(validApiKey), validApiKey);
    assert.true(loggerMock.warn.calledOnceWithExactly('Factory instantiation: You already have 1 factory with this API Key. We recommend keeping only one instance of the factory at all times (Singleton pattern) and reusing it throughout your application.'), 'We register a the same api key again, we get a warning with the number of instances we have.');

    // Same key one more time, 2 instances plus new one.
    assert.equal(apiKeyValidator3.validateApiKey(validApiKey), validApiKey);
    assert.true(loggerMock.warn.calledWithExactly('Factory instantiation: You already have 2 factories with this API Key. We recommend keeping only one instance of the factory at all times (Singleton pattern) and reusing it throughout your application.'), 'We register a the same api key again, we get a warning with the number of instances we have.');

    // Same key one more time, 3 instances plus new one.
    assert.equal(apiKeyValidator3.validateApiKey(validApiKey), validApiKey);
    assert.true(loggerMock.warn.calledWithExactly('Factory instantiation: You already have 3 factories with this API Key. We recommend keeping only one instance of the factory at all times (Singleton pattern) and reusing it throughout your application.'), 'We register a the same api key again, we get a warning with the number of instances we have.');

    // We will release the used api key leaving only 1 "use" on the cache.
    apiKeyValidator3.releaseApiKey(validApiKey);
    apiKeyValidator3.releaseApiKey(validApiKey);
    apiKeyValidator3.releaseApiKey(validApiKey);

    resetStubs();

    // So we get the warning again.
    assert.equal(apiKeyValidator3.validateApiKey(validApiKey), validApiKey);
    assert.true(loggerMock.warn.calledOnceWithExactly('Factory instantiation: You already have 1 factory with this API Key. We recommend keeping only one instance of the factory at all times (Singleton pattern) and reusing it throughout your application.'), 'We register a the same api key again, we get a warning with the number of instances we have.');

    // Leave it with 0
    apiKeyValidator3.releaseApiKey(validApiKey);
    apiKeyValidator3.releaseApiKey(validApiKey);

    resetStubs();

    assert.equal(apiKeyValidator3.validateApiKey(validApiKey), validApiKey);
    assert.false(loggerMock.warn.called, 'If we released the key from all it\'s users, there is no warning when we use it again.');

    resetStubs();
    assert.end();
  });
});
