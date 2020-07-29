import tape from 'tape';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();

const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub(),
  debug: sinon.stub()
};
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
  loggerMock.debug.resetHistory();
}
function LogFactoryMock() {
  return loggerMock;
}
import { STANDALONE_MODE, CONSUMER_MODE } from '../../constants';

// Import the module mocking the logger.
const validateSplitFilters = proxyquireStrict('../../inputValidation/splitFilters', {
  '../logger': LogFactoryMock
}).default;

// Split filter and QueryStrings examples
import { splitFilters, queryStrings } from '../../../__tests__/mocks/fetchSpecificSplits';

tape('INPUT VALIDATION for splitFilters', t => {

  t.test('Returns undefined if `splitFilters` is an invalid object or `mode` is not \'standalone\'', assert => {

    assert.deepEqual(validateSplitFilters(undefined, STANDALONE_MODE), undefined, 'splitFilters ignored if not a non-empty array');
    assert.deepEqual(validateSplitFilters(null, STANDALONE_MODE), undefined, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.notCalled);

    assert.deepEqual(validateSplitFilters(true, STANDALONE_MODE), undefined, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(0).calledWithExactly('Factory instantiation: splitFilters configuration must be a non-empty array of filters.'));

    assert.deepEqual(validateSplitFilters(15, STANDALONE_MODE), undefined, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(1).calledWithExactly('Factory instantiation: splitFilters configuration must be a non-empty array of filters.'));

    assert.deepEqual(validateSplitFilters('string', STANDALONE_MODE), undefined, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(2).calledWithExactly('Factory instantiation: splitFilters configuration must be a non-empty array of filters.'));

    assert.deepEqual(validateSplitFilters([], STANDALONE_MODE), undefined, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(3).calledWithExactly('Factory instantiation: splitFilters configuration must be a non-empty array of filters.'));

    assert.deepEqual(validateSplitFilters([{ type: 'byName', values: ['split_1'] }], CONSUMER_MODE), undefined);
    assert.true(loggerMock.warn.calledWithExactly("Factory instantiation: split filters have been configured but will have no effect if mode is not 'standalone', since synchronization is being deferred to an external tool."));

    assert.true(loggerMock.error.notCalled);

    resetStubs();
    assert.end();
  });

  t.test('Returns object with `undefined` queryString, if `splitFilters` is empty, contain invalid filters or contain filters with no values or invalid values', assert => {

    let splitFilters = [
      { type: 'byName', values: [] },
      { type: 'byName', values: [] },
      { type: 'byPrefix', values: [] }];
    let output = [...splitFilters]; output.queryString = undefined;
    assert.deepEqual(validateSplitFilters(splitFilters, STANDALONE_MODE), output, 'filters without values');
    // assert.true(loggerMock.warn.getCall(0).calledWithExactly('Ignoring byName filter. It has no valid values (no-empty strings).'));
    // assert.true(loggerMock.warn.getCall(1).calledWithExactly('Ignoring byPrefix filter. It has no valid values (no-empty strings).'));

    loggerMock.warn.resetHistory();

    splitFilters.push(
      { type: 'invalid', values: [] },
      { type: 'byName', values: 'invalid' },
      { type: null, values: [] },
      { type: 'byName', values: [13] });
    output.push({ type: 'byName', values: [13] });
    assert.deepEqual(validateSplitFilters(splitFilters, STANDALONE_MODE), output, 'some filters are invalid');
    // assert.true(loggerMock.warn.getCall(0).calledWithExactly("'invalid' is an invalid filter. Only 'byName' and 'byPrefix' are valid."), 'invalid value of `type` property');
    // assert.true(loggerMock.warn.getCall(1).calledWithExactly("Split filter at position '4' is invalid. It must be an object with a valid 'type' filter and a list of 'values'."), 'invalid type of `values` property');
    // assert.true(loggerMock.warn.getCall(2).calledWithExactly("Split filter at position '5' is invalid. It must be an object with a valid 'type' filter and a list of 'values'."), 'invalid type of `type` property');
    // assert.true(loggerMock.warn.getCall(3).calledWithExactly("Malformed value in 'byName' filter ignored: '13'"));
    // assert.true(loggerMock.warn.getCall(4).calledWithExactly('Ignoring byName filter. It has no valid values (no-empty strings).'));
    // assert.true(loggerMock.warn.getCall(5).calledWithExactly('Ignoring byPrefix filter. It has no valid values (no-empty strings).'));
    // assert.equal(loggerMock.warn.callCount, 6);

    // assert.true(loggerMock.error.notCalled);

    loggerMock.warn.resetHistory();
    assert.end();
  });

  t.test('Returns object with a queryString, if `splitFilters` contains at least a valid `byName` or `byPrefix` filter with at least a valid value', assert => {

    for (let i = 0; i < splitFilters.length; i++) {
      const output = [...splitFilters[i]];
      output.queryString = queryStrings[i];
      assert.deepEqual(validateSplitFilters(splitFilters[i], STANDALONE_MODE), output, `splitFilters #${i}`);
      // assert.true(loggerMock.debug.calledWith(`Splits filtering criteria: '${queryStrings[i]}'`));
    }

    resetStubs();
    assert.end();
  });

});