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

    assert.deepEqual(splitFilterBuilder({}), undefined, 'splitFilter ignored if not a non-empty array');
    assert.deepEqual(splitFilterBuilder({ splitFilter: undefined, mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not a non-empty array');
    assert.deepEqual(splitFilterBuilder({ splitFilter: null, mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not a non-empty array');
    assert.true(loggerMock.warn.notCalled);

    assert.deepEqual(splitFilterBuilder({ splitFilter: true, mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(0).calledWithExactly('splitFilter configuration must be a non-empty array of filters'));

    assert.deepEqual(splitFilterBuilder({ splitFilter: 15, mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(1).calledWithExactly('splitFilter configuration must be a non-empty array of filters'));

    assert.deepEqual(splitFilterBuilder({ splitFilter: 'string', mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(2).calledWithExactly('splitFilter configuration must be a non-empty array of filters'));

    assert.deepEqual(splitFilterBuilder({ splitFilter: [], mode: STANDALONE_MODE }), undefined, 'splitFilter ignored if not a non-empty array');
    assert.true(loggerMock.warn.getCall(3).calledWithExactly('splitFilter configuration must be a non-empty array of filters'));

    assert.deepEqual(splitFilterBuilder({ splitFilter: [{ type: 'byName', values: ['split_1'] }], mode: CONSUMER_MODE }), undefined);
    assert.true(loggerMock.warn.calledWithExactly('splitFilter configuration is ignored if mode is not \'standalone\''));

    assert.true(loggerMock.error.notCalled);

    loggerMock.warn.resetHistory();
    assert.end();
  });

  t.test('Returns object with `undefined` queryString, if `splitFilter` is empty, contain invalid filters or contain filters with no values or invalid values', assert => {

    let splitFilter = [
      { type: 'byName', values: [] },
      { type: 'byName', values: [] },
      { type: 'byPrefix', values: [] }];
    let output = [...splitFilter]; output.queryString = undefined;
    assert.deepEqual(splitFilterBuilder({ splitFilter, mode: STANDALONE_MODE }), output, 'filters without values');
    assert.true(loggerMock.warn.notCalled);
    assert.true(loggerMock.error.getCall(0).calledWithExactly('Ignoring byName filter. It has no valid values (no-empty strings).'));
    assert.true(loggerMock.error.getCall(1).calledWithExactly('Ignoring byPrefix filter. It has no valid values (no-empty strings).'));

    loggerMock.warn.resetHistory();
    loggerMock.error.resetHistory();

    splitFilter.push(
      { type: 'invalid', values: [] },
      { type: 'byName', values: 'invalid' },
      { type: null, values: [] },
      { type: 'byName', values: [13] });
    output.push({ type: 'byName', values: [13] });
    assert.deepEqual(splitFilterBuilder({ splitFilter, mode: STANDALONE_MODE }), output, 'some filters are invalid');
    assert.true(loggerMock.warn.getCall(0).calledWithExactly("'invalid' is an invalid filter. Only 'byName' and 'byPrefix' are valid."), 'invalid value of `type` property');
    assert.true(loggerMock.warn.getCall(1).calledWithExactly("Split filter at position '4' is invalid. It must be an object with a valid 'type' filter and a list of 'values'."), 'invalid type of `values` property');
    assert.true(loggerMock.warn.getCall(2).calledWithExactly("Split filter at position '5' is invalid. It must be an object with a valid 'type' filter and a list of 'values'."), 'invalid type of `type` property');
    assert.equal(loggerMock.warn.callCount, 3);
    assert.true(loggerMock.error.getCall(0).calledWithExactly("Malformed value in 'byName' filter ignored: '13'"));
    assert.true(loggerMock.error.getCall(1).calledWithExactly('Ignoring byName filter. It has no valid values (no-empty strings).'));
    assert.true(loggerMock.error.getCall(2).calledWithExactly('Ignoring byPrefix filter. It has no valid values (no-empty strings).'));
    assert.equal(loggerMock.error.callCount, 3);

    loggerMock.warn.resetHistory();
    loggerMock.error.resetHistory();
    assert.end();
  });

  t.test('Returns object with a queryString, if `splitFilter` contains at least a valid `byName` or `byPrefix` filter with at least a valid value', assert => {

    // @TODO

    loggerMock.warn.resetHistory();
    loggerMock.error.resetHistory();
    assert.end();
  });

  // assert.equal(loggerMock.warn.getCall(0).args[0], 'undefined');

});
