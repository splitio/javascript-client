import tape from 'tape';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();

const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub(),
  info: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
import { STANDALONE_MODE, CONSUMER_MODE } from '../../constants';

// Import the module mocking the logger.
const { splitFilterBuilder } = proxyquireStrict('../../settings/splitFilter', {
  '../logger': LogFactoryMock
});

tape('splitFilterBuilder', t => {

  // Check different types, since `splitFilter` param is defined by the user
  t.test('Returns undefined if `splitFilter` is an invalid object or `mode` is not \'standalone\'', assert => {

    assert.deepEqual(splitFilterBuilder({}), undefined, 'splitFilter ignored if not defined');
    assert.deepEqual(splitFilterBuilder({ splitFilter: undefined, mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not an object');
    assert.deepEqual(splitFilterBuilder({ splitFilter: null, mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not an object');
    assert.deepEqual(splitFilterBuilder({ splitFilter: true, mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not an object');
    assert.deepEqual(splitFilterBuilder({ splitFilter: 15, mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not an object');
    assert.deepEqual(splitFilterBuilder({ splitFilter: 'string', mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not an object');
    assert.true(loggerMock.warn.notCalled);

    assert.deepEqual(splitFilterBuilder({ splitFilter: {}, mode: CONSUMER_MODE }), undefined);
    assert.true(loggerMock.warn.calledWithExactly('splitFilter configuration is ignored if mode is not \'standalone\''));
    loggerMock.warn.resetHistory();

    assert.end();
  });

  t.test('Returns empty object if `splitFilter` contain invalid or no filters', assert => {

    assert.deepEqual(splitFilterBuilder({ splitFilter: {}, mode: STANDALONE_MODE }), {});
    assert.true(loggerMock.warn.notCalled);

    assert.deepEqual(splitFilterBuilder({ splitFilter: [], mode: STANDALONE_MODE }), []);
    assert.true(loggerMock.warn.notCalled);

    assert.deepEqual(splitFilterBuilder({ splitFilter: { 'notValidFilter': ['value1'] }, mode: STANDALONE_MODE }), {});
    assert.true(loggerMock.warn.calledWithExactly("'notValidFilter' is an invalid filter. Only 'byName' and 'byPrefix' are valid."));
    loggerMock.warn.resetHistory();

    // assert.deepEqual(validateIntegrationsSettings({ integrations: true }, ['INT_TYPE']), []);
    // assert.deepEqual(validateIntegrationsSettings({ integrations: 123 }, ['INT_TYPE']), []);
    // assert.deepEqual(validateIntegrationsSettings({ integrations: 'string' }, ['INT_TYPE']), []);
    // assert.deepEqual(validateIntegrationsSettings({ integrations: {} }, ['INT_TYPE']), []);
    // assert.deepEqual(validateIntegrationsSettings({ integrations: [] }, ['INT_TYPE']), []);
    // assert.deepEqual(validateIntegrationsSettings({ integrations: [false, 0, Infinity, new Error(), () => { }, []] }, ['INT_TYPE']), []);

    assert.end();
  });

  // assert.equal(loggerMock.warn.getCall(0).args[0], 'undefined');

  // t.test('Filters invalid integrations from `integrations` array', assert => {
  //   const valid = {
  //     type: 'INT1',
  //   };
  //   const validWithOptions = {
  //     type: 'INT1',
  //     param1: 'param1',
  //     param2: 'param2',
  //   };
  //   const otherValidWithOptions = {
  //     type: 'INT2',
  //     param1: 'param1',
  //     param2: 'param2',
  //   };
  //   const invalid = {
  //     param3: 'param3',
  //   };

  //   assert.deepEqual(validateIntegrationsSettings(
  //     { integrations: [valid, validWithOptions, invalid] }), [],
  //   'All integrations are removed if no `validIntegrationTypes` array is passed');
  //   assert.deepEqual(validateIntegrationsSettings(
  //     { integrations: [valid, validWithOptions, otherValidWithOptions, invalid] }, ['INT1']),
  //   [valid, validWithOptions],
  //   'Integrations that do not have the passed types are removed');
  //   assert.deepEqual(validateIntegrationsSettings(
  //     { integrations: [invalid, valid, false, 0, validWithOptions, Infinity, new Error(), otherValidWithOptions, () => { }, [], invalid] }, ['INT1', 'INT2']),
  //   [valid, validWithOptions, otherValidWithOptions],
  //   'Integrations that do not have the passed types or are invalid objects are removed');
  //   assert.end();
  // });

});
