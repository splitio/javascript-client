/* eslint-disable no-console */
import tape from 'tape-catch';
import sinon from 'sinon';
import validateAttributes from '../../inputValidation/attributes';

const isNode = typeof process !== 'undefined' && process.version ? true : false;

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
  null,
  undefined,
  NaN
];

tape('INPUT VALIDATION for Attributes', t => {
  t.test('Should return the passed object if it is a valid attributes map without logging any errors', assert => {
    const consoleMethod = !isNode ? 'error' : 'log';
    const validAttributes = { amIvalid: 'yes', 'are_you_sure': true, howMuch: 10 };
    // Spy on the console method that will be used.
    console[consoleMethod] && sinon.spy(console, consoleMethod);

    assert.deepEqual(validateAttributes(validAttributes, 'some_method_attrs'), validAttributes, 'It should return the passed map if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_attrs'), 'Should not log any errors.');

    console[consoleMethod].restore();

    assert.end();
  });

  t.test('Should return false and log error if attributes map is invalid', assert => {
    const consoleMethod = !isNode ? 'error' : 'log';
    console[consoleMethod] && sinon.spy(console, consoleMethod);

    for (let i = 0; i < invalidAttributes.length; i++) {
      const invalidAttribute = invalidAttributes[i];

      assert.equal(validateAttributes(invalidAttribute, 'test_method'), false, 'Invalid attribute objects should return false.');
      assert.ok(console[consoleMethod].calledWithMatch('[ERROR] test_method: attributes must be a plain object.'), 'The error should be logged for the invalid attributes map.');

      console[consoleMethod].resetHistory();
    }

    console[consoleMethod].restore();

    assert.end();
  });
});
