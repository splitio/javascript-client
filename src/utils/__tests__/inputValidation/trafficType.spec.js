import tape from 'tape-catch';
import sinon from 'sinon';
import { LOCALHOST_MODE, STANDALONE_MODE } from '../../constants';
import thenable from '../../promise/thenable';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();

/* Context~ish mocks */
const contextMockConstants = {
  READY: 'ready',
  SETTINGS: 'settings',
  STORAGE: 'storage'
};
const settingsMock = {
  mode: 'standalone'
};
const storageMock = {
  splits: { trafficTypeExists: sinon.stub().returns(false) }
};
const contextGetMock = sinon.stub();
// start as non-ready
contextGetMock.withArgs(contextMockConstants.READY, true).returns(false);
// settings for non-localstorage
contextGetMock.withArgs(contextMockConstants.SETTINGS).returns(settingsMock);
contextGetMock.withArgs(contextMockConstants.STORAGE).returns(storageMock);
const contextMock = {
  get: contextGetMock,
  constants: contextMockConstants
};

/* Logger mocking */
const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
const { validateTrafficType, validateTrafficTypeExistance } = proxyquireStrict('../../inputValidation/trafficType', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
  storageMock.splits.trafficTypeExists.resetHistory();
}

const errorMsgs = {
  NULL_TRAFFIC_TYPE: 'you passed a null or undefined traffic_type_name, traffic_type_name must be a non-empty string.',
  WRONG_TYPE_TRAFFIC_TYPE: 'you passed an invalid traffic_type_name, traffic_type_name must be a non-empty string.',
  EMPTY_TRAFFIC_TYPE: 'you passed an empty traffic_type_name, traffic_type_name must be a non-empty string.',
  LOWERCASE_TRAFFIC_TYPE: 'traffic_type_name should be all lowercase - converting string to lowercase.',
  NOT_EXISTENT_TT: ttName => `Traffic Type ${ttName} does not have any corresponding Splits in this environment, make sure you're tracking your events to a valid traffic type defined in the Split console.`
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
  t.test('validateTrafficType - Should return the provided traffic type if it is a valid string without logging any errors', assert => {
    assert.equal(validateTrafficType('traffictype', 'some_method_trafficType'), 'traffictype', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.equal(validateTrafficType('traffic_type', 'some_method_trafficType'), 'traffic_type', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.equal(validateTrafficType('traffic-type-23', 'some_method_trafficType'), 'traffic-type-23', 'It should return the provided string if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');

    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('validateTrafficType - Should lowercase the whole traffic type if it is a valid string with uppercases and log a warning (if those are enabled)', assert => {
    for (let i = 0; i < convertibleTrafficTypes.length; i++) {
      const convertibleTrafficType = convertibleTrafficTypes[i];
      loggerMock.warn.resetHistory();

      assert.equal(validateTrafficType(convertibleTrafficType, 'some_method_trafficType'), convertibleTrafficType.toLowerCase(), 'It should return the lowercase version of the traffic type received.');
      assert.ok(loggerMock.warn.calledWithExactly(`some_method_trafficType: ${errorMsgs.LOWERCASE_TRAFFIC_TYPE}`), 'Should log a warning.');
    }

    assert.notOk(loggerMock.error.called, 'It should have not logged any errors.');

    resetStubs();
    assert.end();
  });

  t.test('validateTrafficType - Should return false and log error if traffic type is not a valid string', assert => {
    for (let i = 0; i < invalidTrafficTypes.length; i++) {
      const invalidValue = invalidTrafficTypes[i]['tt'];
      const expectedLog = invalidTrafficTypes[i]['msg'];

      assert.equal(validateTrafficType(invalidValue, 'test_method'), false, 'Invalid traffic types should always return false.');
      assert.ok(loggerMock.error.calledWithExactly(`test_method: ${expectedLog}`), 'Should log the error for the invalid traffic type.');

      loggerMock.error.resetHistory();
    }

    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('validateTrafficTypeExistance - Should return true without going to the storage and log nothing if the SDK is not ready or in localhost mode', assert => {
    // Not ready, but not localstorage
    assert.true(validateTrafficTypeExistance('test_tt', contextMock, 'test_method'), 'If the SDK is not ready yet, it will return true.');
    assert.false(storageMock.splits.trafficTypeExists.called, 'If the SDK is not ready yet, it does not try to go to the storage.');
    assert.false(loggerMock.error.called, 'If the SDK is not ready yet, it will not log any errors.');
    assert.false(loggerMock.error.called, 'If the SDK is not ready yet, it will not log any errors.');

    // Ready but in localstorage mode.
    settingsMock.mode = LOCALHOST_MODE;
    contextGetMock.withArgs(contextMockConstants.READY, true).returns(true);
    assert.true(validateTrafficTypeExistance('test_tt', contextMock, 'test_method'), 'If the SDK is in localhost mode, it will return true.');
    assert.false(storageMock.splits.trafficTypeExists.called, 'If the SDK is in localhost mode, it does not try to go to the storage.');
    assert.false(loggerMock.warn.called, 'If the SDK is in localhost mode, it will not log any warnings.');
    assert.false(loggerMock.error.called, 'If the SDK is in localhost mode, it will not log any errors.');

    resetStubs();
    assert.end();
  });

  t.test('validateTrafficTypeExistance - Should return true and log nothing if SDK Ready, not localhost mode and the traffic type exists in the storage', assert => {
    // Ready, standalone, the TT exists in the storage.
    const testTT = 'test_existent_tt';
    settingsMock.mode = STANDALONE_MODE;
    contextGetMock.withArgs(contextMockConstants.READY, true).returns(true);
    storageMock.splits.trafficTypeExists.withArgs(testTT).returns(true);

    assert.true(validateTrafficTypeExistance(testTT, contextMock, 'test_method'), 'If the SDK is in condition to validate but the TT exists, it will return true.');
    assert.true(storageMock.splits.trafficTypeExists.calledOnceWithExactly(testTT), 'If the SDK is in condition to validate, it checks that TT existance with the storage.');
    assert.false(loggerMock.warn.called, 'If the SDK is in condition to validate but the TT exists, it will not log any warnings.');
    assert.false(loggerMock.error.called, 'If the SDK is in condition to validate but the TT exists, it will not log any errors.');

    resetStubs();
    assert.end();
  });

  t.test('validateTrafficTypeExistance - Should return false and log warning if SDK Ready, not localhost mode and the traffic type does NOT exist in the storage', assert => {
    // Ready, standalone, the TT exists in the storage.
    const testTT = 'test_not_existent_tt';
    settingsMock.mode = STANDALONE_MODE;
    contextGetMock.withArgs(contextMockConstants.READY, true).returns(true);

    assert.false(validateTrafficTypeExistance(testTT, contextMock, 'test_method_y'), 'If the SDK is in condition to validate but the TT does not exist in the storage, it will return false.');
    assert.true(storageMock.splits.trafficTypeExists.calledOnceWithExactly(testTT), 'If the SDK is in condition to validate, it checks that TT existance with the storage.');
    assert.true(loggerMock.warn.calledOnceWithExactly(`test_method_y: ${errorMsgs.NOT_EXISTENT_TT(testTT)}`), 'If the SDK is in condition to validate but the TT does not exist in the storage, it will log the expected warning.');
    assert.false(loggerMock.error.called, 'It logged a warning so no errors should be logged.');

    resetStubs();
    assert.end();
  });

  t.test('validateTrafficTypeExistance w/async storage - If the storage is async but the SDK is in condition to validate, it will validate that the TT exists on the storage', async assert => {
    // Ready, standalone, the TT exists in the storage.
    const testTT = 'test_existent_async_tt';
    settingsMock.mode = STANDALONE_MODE;
    contextGetMock.withArgs(contextMockConstants.READY, true).returns(true);
    storageMock.splits.trafficTypeExists.withArgs(testTT).resolves(true);

    const validationPromise = validateTrafficTypeExistance(testTT, contextMock, 'test_method_z');
    assert.true(thenable(validationPromise), 'If the storage is async, it should also return a promise.');
    assert.true(storageMock.splits.trafficTypeExists.calledOnceWithExactly(testTT), 'If the SDK is in condition to validate, it checks that TT existance with the async storage.');
    assert.false(loggerMock.warn.called, 'We are still fetching the data from the storage, no logs yet.');
    assert.false(loggerMock.error.called, 'We are still fetching the data from the storage, no logs yet.');

    const isValid = await validationPromise;

    assert.true(isValid, 'As the split existed, it will resolve to true.');
    assert.false(loggerMock.warn.called, 'It was valid so no logs.');
    assert.false(loggerMock.error.called, 'It was valid so no logs.');

    // Second round, a TT that does not exist on the asnyc storage
    const testTT2 = 'test_not_existent_async_tt';
    storageMock.splits.trafficTypeExists.resetHistory();
    storageMock.splits.trafficTypeExists.withArgs(testTT2).resolves(false);

    const validationPromise2 = validateTrafficTypeExistance(testTT2, contextMock, 'test_method_z');
    assert.true(thenable(validationPromise2), 'If the storage is async, it should also return a promise.');
    assert.true(storageMock.splits.trafficTypeExists.calledOnceWithExactly(testTT2), 'If the SDK is in condition to validate, it checks that TT existance with the async storage.');
    assert.false(loggerMock.warn.called, 'We are still fetching the data from the storage, no logs yet.');
    assert.false(loggerMock.error.called, 'We are still fetching the data from the storage, no logs yet.');

    const isValid2 = await validationPromise2;
    assert.false(isValid2, 'As the split is not on the storage, it will resolve to false, failing the validation..');
    assert.true(loggerMock.warn.calledOnceWithExactly(`test_method_z: ${errorMsgs.NOT_EXISTENT_TT(testTT2)}`), 'If the SDK is in condition to validate but the TT does not exist in the storage, it will log the expected warning.');
    assert.false(loggerMock.error.called, 'It logged a warning so no errors should be logged.');

    resetStubs();
    assert.end();
  });
});
