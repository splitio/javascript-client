/* eslint-disable no-console */
import tape from 'tape-catch';
import sinon from 'sinon';
import validateValue from '../../inputValidation/eventValue';

const isNode = typeof process !== 'undefined' && process.version ? true : false;

const invalidValues = [
  [],
  () => {},
  false,
  true,
  {},
  Object.create({}),
  'something',
  NaN,
  -Infinity,
  Infinity,
  new Promise(res => res),
  Symbol('asd'),
  null,
  undefined
];

tape('INPUT VALIDATION for Event Values', t => {
  t.test('Should return the passed value if it is a valid finite number without logging any errors', assert => {
    const consoleMethod = !isNode ? 'error' : 'log';
    // Spy on the console method that will be used.
    console[consoleMethod] && sinon.spy(console, consoleMethod);

    assert.equal(validateValue(50, 'some_method_eventValue'), 50, 'It should return the passed number if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_eventValue'), 'Should not log any errors.');
    assert.equal(validateValue(-50, 'some_method_eventValue'), -50, 'It should return the passed number if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_eventValue'), 'Should not log any errors.');

    console[consoleMethod].restore();

    assert.end();
  });

  t.test('Should return false and log error if event value is not a valid finite number', assert => {
    const consoleMethod = !isNode ? 'error' : 'log';
    console[consoleMethod] && sinon.spy(console, consoleMethod);

    for (let i = 0; i < invalidValues.length; i++) {
      const invalidValue = invalidValues[i];

      assert.equal(validateValue(invalidValue, 'test_method'), false, 'Invalid event values should always return false.');
      assert.ok(console[consoleMethod].calledWithMatch('[ERROR] test_method: value must be a finite number.'), 'Should log the error for the invalid event value.');

      console[consoleMethod].resetHistory();
    }

    console[consoleMethod].restore();

    assert.end();
  });
});
