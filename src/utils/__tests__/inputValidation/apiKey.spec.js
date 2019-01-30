import proxyquire from 'proxyquire';
import tape from 'tape-catch';
import sinon from 'sinon';

const proxyquireStrict = proxyquire.noCallThru();

const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
const validateApiKey = proxyquireStrict('../../inputValidation/apiKey', {
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
    assert.notOk(loggerMock.called, 'Should not log any errors.');

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
});
