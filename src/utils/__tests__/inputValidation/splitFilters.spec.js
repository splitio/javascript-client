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
import { splitFilters, queryStrings, groupedFilters } from '../../../__tests__/mocks/fetchSpecificSplits';

tape('INPUT VALIDATION for splitFilters', t => {

  let defaultOutput = {
    validFilters: [],
    queryString: null,
    groupedFilters: {}
  };

  t.test('Returns default output with empty values if `splitFilters` is an invalid object or `mode` is not \'standalone\'', assert => {

    assert.deepEqual(validateSplitFilters(undefined, STANDALONE_MODE), defaultOutput, 'splitFilters ignored if not a non-empty array');
    assert.deepEqual(validateSplitFilters(null, STANDALONE_MODE), defaultOutput, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.notCalled);

    assert.deepEqual(validateSplitFilters(true, STANDALONE_MODE), defaultOutput, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(0).calledWithExactly('Factory instantiation: splitFilters configuration must be a non-empty array of filter objects.'));

    assert.deepEqual(validateSplitFilters(15, STANDALONE_MODE), defaultOutput, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(1).calledWithExactly('Factory instantiation: splitFilters configuration must be a non-empty array of filter objects.'));

    assert.deepEqual(validateSplitFilters('string', STANDALONE_MODE), defaultOutput, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(2).calledWithExactly('Factory instantiation: splitFilters configuration must be a non-empty array of filter objects.'));

    assert.deepEqual(validateSplitFilters([], STANDALONE_MODE), defaultOutput, 'splitFilters ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(3).calledWithExactly('Factory instantiation: splitFilters configuration must be a non-empty array of filter objects.'));

    assert.deepEqual(validateSplitFilters([{ type: 'byName', values: ['split_1'] }], CONSUMER_MODE), defaultOutput);
    assert.true(loggerMock.warn.calledWithExactly("Factory instantiation: split filters have been configured but will have no effect if mode is not 'standalone', since synchronization is being deferred to an external tool."));

    assert.true(loggerMock.debug.notCalled);
    assert.true(loggerMock.error.notCalled);

    resetStubs();
    assert.end();
  });

  t.test('Returns object with null queryString, if `splitFilters` contains invalid filters or contains filters with no values or invalid values', assert => {

    let splitFilters = [
      { type: 'byName', values: [] },
      { type: 'byName', values: [] },
      { type: 'byPrefix', values: [] }];
    let output = {
      validFilters: [...splitFilters],
      queryString: null,
      groupedFilters: { byName: [], byPrefix: [] }
    };
    assert.deepEqual(validateSplitFilters(splitFilters, STANDALONE_MODE), output, 'filters without values');
    assert.true(loggerMock.debug.getCall(0).calledWithExactly("Factory instantiation: splits filtering criteria is 'null'."));
    loggerMock.debug.resetHistory();

    splitFilters.push(
      { type: 'invalid', values: [] },
      { type: 'byName', values: 'invalid' },
      { type: null, values: [] },
      { type: 'byName', values: [13] });
    output.validFilters.push({ type: 'byName', values: [13] });
    assert.deepEqual(validateSplitFilters(splitFilters, STANDALONE_MODE), output, 'some filters are invalid');
    assert.true(loggerMock.debug.getCall(0).calledWithExactly("Factory instantiation: splits filtering criteria is 'null'."));
    assert.true(loggerMock.warn.getCall(0).calledWithExactly("Factory instantiation: split filter at position '3' is invalid. It must be an object with a valid filter type ('byName' or 'byPrefix') and a list of 'values'."), 'invalid value of `type` property');
    assert.true(loggerMock.warn.getCall(1).calledWithExactly("Factory instantiation: split filter at position '4' is invalid. It must be an object with a valid filter type ('byName' or 'byPrefix') and a list of 'values'."), 'invalid type of `values` property');
    assert.true(loggerMock.warn.getCall(2).calledWithExactly("Factory instantiation: split filter at position '5' is invalid. It must be an object with a valid filter type ('byName' or 'byPrefix') and a list of 'values'."), 'invalid type of `type` property');
    assert.equal(loggerMock.warn.callCount, 3);

    assert.true(loggerMock.error.notCalled);

    resetStubs();
    assert.end();
  });

  t.test('Returns object with a queryString, if `splitFilters` contains at least a valid `byName` or `byPrefix` filter with at least a valid value', assert => {

    for (let i = 0; i < splitFilters.length; i++) {

      if (groupedFilters[i]) { // tests where validateSplitFilters executes normally
        const output = {
          validFilters: [...splitFilters[i]],
          queryString: queryStrings[i],
          groupedFilters: groupedFilters[i]
        };
        assert.deepEqual(validateSplitFilters(splitFilters[i], STANDALONE_MODE), output, `splitFilters #${i}`);
        assert.true(loggerMock.debug.calledWith(`Factory instantiation: splits filtering criteria is '${queryStrings[i]}'.`));

      } else { // tests where validateSplitFilters throws an exception
        assert.throws(() => validateSplitFilters(splitFilters[i], STANDALONE_MODE), queryStrings[i]);
      }
    }

    resetStubs();
    assert.end();
  });

});
