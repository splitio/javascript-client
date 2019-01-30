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
const validateTrafficType = proxyquireStrict('../../inputValidation/trafficType', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

const errorMsgs = {
  NULL_TRAFFIC_TYPE: 'you passed a null or undefined traffic_type_name, traffic_type_name must be a non-empty string.',
  WRONG_TYPE_TRAFFIC_TYPE: 'you passed an invalid traffic_type_name, traffic_type_name must be a non-empty string.',
  EMPTY_TRAFFIC_TYPE: 'you passed an empty traffic_type_name, traffic_type_name must be a non-empty string.',
  LOWERCASE_TRAFFIC_TYPE: 'traffic_type_name should be all lowercase - converting string to lowercase.'
};

const invalidTrafficTypes = [
  { tt: [], msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: () => {}, msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: Object.create({}), msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: {}, msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: true, msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: false, msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: 10, msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: 0, msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: NaN, msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: Infinity, msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: null, msg: errorMsgs.NULL_TRAFFIC_TYPE },
  { tt: undefined, msg: errorMsgs.NULL_TRAFFIC_TYPE },
  { tt: new Promise(res => res), msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: Symbol('asd'), msg: errorMsgs.WRONG_TYPE_TRAFFIC_TYPE },
  { tt: '', msg: errorMsgs.EMPTY_TRAFFIC_TYPE }
];

const convertibleTrafficTypes = [
  'tRaFfIc_TyP3_t3S7',
  'trafficTypeTest',
  'TRAFFICTYPE'
];

tape('INPUT VALIDATION for Traffic Types', t => {
  t.test('Should return the provided traffic type if it is a valid string without logging any errors', assert => {
    assert.equal(validateTrafficType('traffictype', 'some_method_trafficType'), 'traffictype', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.equal(validateTrafficType('traffic_type', 'some_method_trafficType'), 'traffic_type', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.equal(validateTrafficType('traffic-type-23', 'some_method_trafficType'), 'traffic-type-23', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');

    resetStubs();
    assert.end();
  });

  t.test('Should lowercase the whole traffic type if it is a valid string with uppercases and log a warning (if those are enabled)', assert => {
    for (let i = 0; i < convertibleTrafficTypes.length; i++) {
      const convertibleTrafficType = convertibleTrafficTypes[i];
      loggerMock.warn.resetHistory();

      assert.equal(validateTrafficType(convertibleTrafficType, 'some_method_trafficType'), convertibleTrafficType.toLowerCase(), 'It should return the lowercase version of the traffic type received.');
      assert.ok(loggerMock.warn.calledWithExactly(`some_method_trafficType: ${errorMsgs.LOWERCASE_TRAFFIC_TYPE}`), 'Should log a warning.');
    }

    resetStubs();
    assert.end();
  });

  t.test('Should return false and log error if traffic type is not a valid string', assert => {
    for (let i = 0; i < invalidTrafficTypes.length; i++) {
      const invalidValue = invalidTrafficTypes[i]['tt'];
      const expectedLog = invalidTrafficTypes[i]['msg'];

      assert.equal(validateTrafficType(invalidValue, 'test_method'), false, 'Invalid traffic types should always return false.');
      assert.ok(loggerMock.error.calledWithExactly(`test_method: ${expectedLog}`), 'Should log the error for the invalid traffic type.');

      loggerMock.error.resetHistory();
    }

    resetStubs();
    assert.end();
  });
});
