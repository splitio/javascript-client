/* eslint-disable no-console */
import tape from 'tape-catch';
import sinon from 'sinon';
import validateEventType from '../../inputValidation/event';

const isNode = typeof process !== 'undefined' && process.version ? true : false;

const errorMsgs = {
  NULL_EVENT: () => 'you passed a null or undefined event_type, event_type must be a non-empty string.',
  WRONG_TYPE_EVENT: () => 'you passed an invalid event_type, event_type must be a non-empty string.',
  EMPTY_EVENT: () => 'you passed an empty event_type, event_type must be a non-empty string.',
  WRONG_FORMAT_EVENT: invalidEvent => `you passed "${invalidEvent}", event_type must adhere to the regular expression /^[a-zA-Z0-9][-_.:a-zA-Z0-9]{0,79}$/g. This means an event_type must be alphanumeric, cannot be more than 80 characters long, and can only include a dash, underscore, period, or colon as separators of alphanumeric characters.`
};

const invalidEvents = [
  { event: [], msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: () => {}, msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: false, msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: true, msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: {}, msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: Object.create({}), msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: 'something+withInvalidchars', msg: errorMsgs.WRONG_FORMAT_EVENT },
  { event: 'with spaces', msg: errorMsgs.WRONG_FORMAT_EVENT },
  { event: ' asd', msg: errorMsgs.WRONG_FORMAT_EVENT },
  { event: 'asd ', msg: errorMsgs.WRONG_FORMAT_EVENT },
  { event: '?', msg: errorMsgs.WRONG_FORMAT_EVENT },
  { event: '', msg: errorMsgs.EMPTY_EVENT },
  { event: NaN, msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: -Infinity, msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: Infinity, msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: new Promise(res => res), msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: Symbol('asd'), msg: errorMsgs.WRONG_TYPE_EVENT },
  { event: null, msg: errorMsgs.NULL_EVENT },
  { event: undefined, msg: errorMsgs.NULL_EVENT }
];

tape('INPUT VALIDATION for Event types', t => {
  t.test('Should return the provided event type if it is a valid string without logging any errors', assert => {
    const consoleMethod = !isNode ? 'error' : 'log';
    // Spy on the console method that will be used.
    console[consoleMethod] && sinon.spy(console, consoleMethod);

    assert.equal(validateEventType('valid:Too', 'some_method_eventType'), 'valid:Too', 'It should return the provided string if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_eventType'), 'Should not log any errors.');
    assert.equal(validateEventType('I.am.valid-string_ValUe', 'some_method_eventType'), 'I.am.valid-string_ValUe', 'It should return the provided string if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_eventType'), 'Should not log any errors.');
    assert.equal(validateEventType('a', 'some_method_eventType'), 'a', 'It should return the provided string if it is valid.');
    assert.notOk(console[consoleMethod].calledWithMatch('[ERROR] some_method_eventType'), 'Should not log any errors.');

    console[consoleMethod].restore();

    assert.end();
  });

  t.test('Should return false and log error if event type is not a valid string', assert => {
    const consoleMethod = !isNode ? 'error' : 'log';
    console[consoleMethod] && sinon.spy(console, consoleMethod);

    for (let i = 0; i < invalidEvents.length; i++) {
      const invalidValue = invalidEvents[i]['event'];
      const expectedLog = invalidEvents[i]['msg'](invalidValue);

      assert.equal(validateEventType(invalidValue, 'test_method'), false, 'Invalid event types should always return false.');
      assert.ok(console[consoleMethod].calledWithMatch(`[ERROR] test_method: ${expectedLog}`), 'Should log the error for the invalid event type.');

      console[consoleMethod].resetHistory();
    }

    console[consoleMethod].restore();

    assert.end();
  });
});
