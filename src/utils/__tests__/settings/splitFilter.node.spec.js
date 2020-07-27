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

    resetStubs();
    assert.end();
  });

  t.test('Returns object with `undefined` queryString, if `splitFilter` is empty, contain invalid filters or contain filters with no values or invalid values', assert => {

    let splitFilter = [
      { type: 'byName', values: [] },
      { type: 'byName', values: [] },
      { type: 'byPrefix', values: [] }];
    let output = [...splitFilter]; output.queryString = undefined;
    assert.deepEqual(splitFilterBuilder({ splitFilter, mode: STANDALONE_MODE }), output, 'filters without values');
    assert.true(loggerMock.warn.getCall(0).calledWithExactly('Ignoring byName filter. It has no valid values (no-empty strings).'));
    assert.true(loggerMock.warn.getCall(1).calledWithExactly('Ignoring byPrefix filter. It has no valid values (no-empty strings).'));

    loggerMock.warn.resetHistory();

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
    assert.true(loggerMock.warn.getCall(3).calledWithExactly("Malformed value in 'byName' filter ignored: '13'"));
    assert.true(loggerMock.warn.getCall(4).calledWithExactly('Ignoring byName filter. It has no valid values (no-empty strings).'));
    assert.true(loggerMock.warn.getCall(5).calledWithExactly('Ignoring byPrefix filter. It has no valid values (no-empty strings).'));
    assert.equal(loggerMock.warn.callCount, 6);

    assert.true(loggerMock.error.notCalled);

    loggerMock.warn.resetHistory();
    assert.end();
  });

  t.test('Returns object with a queryString, if `splitFilter` contains at least a valid `byName` or `byPrefix` filter with at least a valid value', assert => {

    const valuesExamples = [
      ['\u0223abc', 'abc\u0223asd', 'abc\u0223'],
      ['ausgefüllt']
    ];

    let splitFilter = [
      { type: 'byName', values: valuesExamples[0] },
      { type: 'byName', values: valuesExamples[1] },
      { type: 'byPrefix', values: [] }];
    let output = [...splitFilter]; output.queryString = 'names=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc';
    assert.deepEqual(splitFilterBuilder({ splitFilter, mode: STANDALONE_MODE }), output, 'byName filter has elements');
    assert.true(loggerMock.debug.calledWith("Splits filtering criteria: 'names=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc'"));

    splitFilter = [
      { type: 'byPrefix', values: valuesExamples[0] },
      { type: 'byPrefix', values: valuesExamples[1] },
      { type: 'byName', values: [] }];
    output = [...splitFilter]; output.queryString = 'prefixes=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc';
    assert.deepEqual(splitFilterBuilder({ splitFilter, mode: STANDALONE_MODE }), output, 'byPrefix filter has elements');
    assert.true(loggerMock.debug.calledWith("Splits filtering criteria: 'prefixes=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc'"));

    splitFilter = [
      { type: 'byName', values: valuesExamples[0] },
      { type: 'byName', values: valuesExamples[1] },
      { type: 'byPrefix', values: valuesExamples[0] },
      { type: 'byPrefix', values: valuesExamples[1] }];
    output = [...splitFilter]; output.queryString = 'names=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc&prefixes=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc';
    assert.deepEqual(splitFilterBuilder({ splitFilter, mode: STANDALONE_MODE }), output, 'byName and byPrefix filter have elements');
    assert.true(loggerMock.debug.calledWith("Splits filtering criteria: 'names=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc&prefixes=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc'"));

    resetStubs();
    assert.end();
  });

  // assert.equal(loggerMock.warn.getCall(0).args[0], 'undefined');

});
