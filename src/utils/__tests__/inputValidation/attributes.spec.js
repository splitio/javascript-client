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
const { validateAttributes, validateAttributesDeep } = proxyquireStrict('../../inputValidation/attributes', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

const invalidAttributes = [
  [],
  () => {},
  false,
  true,
  5,
  'something',
  NaN,
  -Infinity,
  new Promise(res => res),
  Symbol('asd'),
  NaN
];

tape('INPUT VALIDATION for Attributes', t => {
  t.test('Should return the passed object if it is a valid attributes map without logging any errors', assert => {
    const validAttributes = { amIvalid: 'yes', 'are_you_sure': true, howMuch: 10 };

    assert.deepEqual(validateAttributes(validAttributes, 'some_method_attrs'), validAttributes, 'It should return the passed map if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('Should return the passed value if it is null or undefined (since attributes are optional) without logging any errors', assert => {
    assert.equal(validateAttributes(null, 'some_method_attrs'), null, 'It should return the passed null.');
    assert.equal(validateAttributes(undefined, 'some_method_attrs'), undefined, 'It should return the passed undefined.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('Should return false and log error if attributes map is invalid', assert => {
    for (let i = 0; i < invalidAttributes.length; i++) {
      const invalidAttribute = invalidAttributes[i];

      assert.equal(validateAttributes(invalidAttribute, 'test_method'), false, 'Invalid attribute objects should return false.');
      assert.ok(loggerMock.error.calledWithExactly('test_method: attributes must be a plain object.'), 'The error should be logged for the invalid attributes map.');

      loggerMock.error.resetHistory();
    }

    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });
});

tape('DEEP INPUT VALIDATION for Attributes', t => {
  t.test('Should return true if it is a valid attributes map without logging any errors', assert => {
    const validAttributes = { amIvalid: 'yes', 'are_you_sure': true, howMuch: 10, 'spell':['1','0'] };

    assert.deepEqual(validateAttributesDeep(validAttributes, 'some_method_attrs'), true, 'It should return true if it is valid.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('Should return true if it is null or undefined (since attributes are optional) without logging any errors', assert => {
    assert.equal(validateAttributesDeep({'attrKey': null}, 'some_method_attrs'), true, 'It should return true.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('Should return false and log error if attributes map is invalid', assert => {
    
    assert.equals(validateAttributesDeep({'': 'empty'}, 'some_method_attrs'), false, 'It should be invalid if the attribute key is not a string');
    assert.equals(validateAttributesDeep({'attributeKey': new Date()}, 'some_method_attrs'), false, 'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');
    assert.equals(validateAttributesDeep({'attributeKey': {'some':'object'}}), false, 'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');
    assert.equals(validateAttributesDeep({'attributeKey': Infinity}), false, 'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');

    assert.notOk(loggerMock.error.called, 'Should not log any errors.');

    resetStubs();
    assert.end();
  });

  t.test('Should return true if attributes map is valid', assert => {
    assert.equals(validateAttributesDeep({'attributeKey': 'attributeValue'}), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
    assert.equals(validateAttributesDeep({'attributeKey': ['attribute','value']}), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
    assert.equals(validateAttributesDeep({'attributeKey': 25}), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
    assert.equals(validateAttributesDeep({'attributeKey': false}), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
    assert.equals(validateAttributesDeep({'attributeKey': Date.now()}), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');

    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });
});
