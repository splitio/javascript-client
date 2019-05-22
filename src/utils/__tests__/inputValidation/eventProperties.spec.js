import tape from 'tape-catch';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();

const loggerMock = {
  warn: sinon.stub(),
  error: sinon.stub()
};
function LogFactoryMock() {
  return loggerMock;
}
const { validateEventProperties } = proxyquireStrict('../../inputValidation/eventProperties', {
  '../logger': LogFactoryMock
});

/* We'll reset the history for the next test */
function resetStubs() {
  loggerMock.warn.resetHistory();
  loggerMock.error.resetHistory();
}

function calculateSize(obj) {
  // we calculate the expected size.
  const keys = Object.keys(obj);
  // each string char counts as two bytes.
  const keysSize = keys.reduce((accum, key) => accum + (key.length * 2), 0);
  const valuesSize = keys.reduce((accum, key) => {
    if (obj[key] === null) return accum; // 0 for null
    if (Number.isFinite(obj[key])) return accum + 8; // 8 for numbers
    if (obj[key] === true || obj[key] === false) return accum + 4; // 4 for bool
    if (typeof obj[key] === 'string') return accum + (obj[key].length * 2);

    return accum; // Invalid props won't count towards the size, since those should had been
  }, 0);
  return keysSize + valuesSize;
}

const invalidValues = [
  [],
  () => {},
  false,
  true,
  'something',
  NaN,
  -Infinity,
  Infinity,
  new Promise(res => res),
  Symbol('asd'),
  new Map()
];

tape('INPUT VALIDATION for Event Properties', t => {
  t.test('Not setting the properties object is acceptable', assert => {
    assert.deepEqual(
      validateEventProperties(undefined, 'some_method_eventProps'),
      {
        properties: null,
        size: 1024
      },
      'It should return null in replacement of undefined since it is valid with default event size.');
    assert.deepEqual(
      validateEventProperties(undefined, 'some_method_eventProps'),
      {
        properties: null,
        size: 1024
      },
      'It should return the passed null since it is valid with default event size.');

    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('When setting a value for properties, only objects are acceptable', assert => {

    invalidValues.forEach(val => {
      assert.deepEqual(
        validateEventProperties(val, 'some_method_eventProps'),
        {
          properties: false,
          size: 1024
        },
        'It should return default size and properties false if the properties value is not an object or null/undefined.');
      assert.ok(loggerMock.error.calledOnceWithExactly('some_method_eventProps: properties must be a plain object.'), 'Should log an error.');
      loggerMock.error.resetHistory();
    });


    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('It should return the properties object when valid and also the correct event size', assert => {
    // The events are considered to weight 1024 bytes (1kb) in average without props. Properties add to that.
    const validProperties = {
      bool: true,
      falseyBool: false,
      string: 'a string',
      number: 123,
      number2: 0.250,
      nullProp: null
    };
    const output = validateEventProperties(validProperties, 'some_method_eventProps');

    assert.deepEqual(
      output,
      {
        properties: validProperties,
        size: 1024 + calculateSize(validProperties)
      },
      'It should return the properties and the event size.');

    assert.notEqual(validProperties, output.properties, 'Returned properties should be a clone.');

    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  t.test('It should return the properties object when valid and also the correct event size, nulling any invalid prop', assert => {
    // The events are considered to weight 1024 bytes (1kb) in average without props. Properties add to that.
    const providedProperties = {
      bool: true,
      falseyBool: false,
      string: 'a string',
      number: 123,
      nullProp: null,
      willBeNulled1: function() {},
      willBeNulled2: {},
      willBeNulled3: [],
      willBeNulled4: new Map()
    };
    const output = validateEventProperties(providedProperties, 'some_method_eventProps');

    assert.deepEqual(
      output,
      {
        properties: {
          ...providedProperties,
          willBeNulled1: null, willBeNulled2: null, willBeNulled3: null, willBeNulled4: null
        },
        size: 1024 + calculateSize(providedProperties)
      },
      'It should return the properties and the event size.');

    assert.notEqual(providedProperties, output.properties, 'Returned properties should be a clone.');

    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.equal(loggerMock.warn.callCount, 4, 'It should have logged one warning per each property of the invalid type.');

    ['willBeNulled1', 'willBeNulled2', 'willBeNulled3', 'willBeNulled4'].forEach(key => {
      assert.ok(loggerMock.warn.calledWithExactly(`some_method_eventProps: Property ${key} is of invalid type. Setting value to null.`));
    });

    resetStubs();
    assert.end();
  });

  t.test('It should log a warning if the object has more than the max amount of allowed keys, logging a warning and returning the event (if other validations pass)', assert => {
    const validProperties = {};

    for (let i = 0; i < 300; i++) {
      validProperties[i] = null; // all will be null so we do not exceed the size.
    }
    let output = validateEventProperties(validProperties, 'some_method_eventProps');

    assert.deepEqual(
      output,
      {
        properties: validProperties,
        size: 1024 + calculateSize(validProperties)
      },
      'It should return the properties and the event size.');

    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'It should have not logged any warnings.');

    validProperties.a = null; // Adding one prop to exceed the limit.
    output = validateEventProperties(validProperties, 'some_method_eventProps');

    assert.deepEqual(
      output,
      {
        properties: validProperties,
        size: 1024 + calculateSize(validProperties)
      },
      'It should return the properties and the event size.');

    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.ok(loggerMock.warn.calledOnceWithExactly('some_method_eventProps: Event has more than 300 properties. Some of them will be trimmed when processed.'), 'It should have not logged any warnings.');

    resetStubs();
    assert.end();
  });

  const fiveHundredChars = 'JKHSAKFJASHFJKASHSFKHAKJSGJKASGH1234567890JASHGJHASGJKAHSJKGHAJKSHGJKAHGJKASHajksghkjahsgjkhsakjghjkashgjkhagjkhajksghjkahsgjksahgjkahsgjkhasgjkhsagjkabsgjhaenjkrnjkwnqrkjnqwekjrnkjweqntkjnjkenasdjkngjksdajkghkjdasgkjnadsjgn asdkjgnkjsadngkjnasdjkngjknasdkjgnasdlgnsdakgnlkasndugbuoewqoitnwlkgadsgjdnsagubadisugboisdngklasdgndsgbjasdbgjkasbdgubuiqwetoiqhweiojtioweqhtiohqweiohtiowqehtoihewqiobtgoiqwengiowqnegionwqeogiqwneoignqiowegnioqewgnwqoiegnoiqwengiowqnegoinqwgionqwegionwqeoignqwegoinoiadnfaosignoiansgk';
  t.test('It should log an error and not return the properties if it exceeds the 32kb size limit', assert => {
    const validProperties = {};

    for (let i = 10; i < 41; i++) {
      validProperties[i] = fiveHundredChars; // key length is two, plus 510 chars it is 512 which multiplied by the byte size of each char is 1kb each key.
    }
    // It should be right on the size limit.
    let output = validateEventProperties(validProperties, 'some_method_eventProps');

    assert.deepEqual(
      output,
      {
        properties: validProperties,
        size: 1024 + calculateSize(validProperties)
      },
      'It should return the properties and the event size.');

    assert.notEqual(validProperties, output.properties, 'Returned properties should be a clone.');
    assert.notOk(loggerMock.error.called, 'Should not log any errors.');
    assert.notOk(loggerMock.warn.called, 'Should not log any warnings.');

    validProperties.a = null; // exceed by two bytes (1 char string key which is two bytes, null value which we count as 0 to match other SDKs)

    output = validateEventProperties(validProperties, 'some_method_eventProps');

    assert.deepEqual(
      output,
      {
        properties: false,
        size: (1024 * 32) + 2 // the two extra bytes.
      },
      'It should return false instead of the properties and the event size.');

    assert.notOk(loggerMock.warn.called, 'Should not log any warnings.');
    assert.ok(loggerMock.error.calledOnceWithExactly('some_method_eventProps: The maximum size allowed for the properties is 32768 bytes, which was exceeded. Event not queued.'), 'Should not log any errors.');

    loggerMock.error.resetHistory();

    resetStubs();
    assert.end();
  });
});
