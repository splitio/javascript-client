import tape from 'tape-catch';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();

// mocked methods return the provided attributes object (2nd argument), to assert that it was properly passed
const clientMock = {
  getTreatment: sinon.stub().returnsArg(2),
  getTreatments: sinon.stub().returnsArg(2),
  getTreatmentWithConfig: sinon.stub().returnsArg(2),
  getTreatmentsWithConfig: sinon.stub().returnsArg(2)
};

function ClientFactoryMock() {
  return clientMock;
}

const AttributesDecorationMockedClient = proxyquireStrict(
  '../attributesDecoration',
  {
    './inputValidation': ClientFactoryMock
  }
).default;

const client = AttributesDecorationMockedClient({});

tape('ATTRIBUTES DECORATION / storage', assert => {

  client.setAttribute('attributeName1', 'attributeValue1');
  client.setAttribute('attributeName2', 'attributeValue2');

  let values = client.getAttributes();

  assert.deepEqual(values, { attributeName1: 'attributeValue1', attributeName2: 'attributeValue2' }, 'It should be equal');

  client.removeAttribute('attributeName1');
  client.setAttribute('attributeName2', 'newAttributeValue2');

  assert.equal(client.getAttribute('attributeName1'), undefined, 'It should throw undefined');
  assert.equal(client.getAttribute('attributeName2'), 'newAttributeValue2', 'It should be equal');

  client.setAttributes({
    'attributeName3': 'attributeValue3',
    'attributeName4': 'attributeValue4'
  });

  assert.deepEqual(values, { attributeName2: 'newAttributeValue2', attributeName3: 'attributeValue3', attributeName4: 'attributeValue4' }, 'It should be equal');

  client.clearAttributes();

  values = client.getAttributes();

  assert.equal(Object.keys(values).length, 0, 'It should be zero after clearing attributes');

  assert.end();
});


tape('ATTRIBUTES DECORATION / validation', t => {

  t.test('Should return true if it is a valid attributes map without logging any errors', assert => {
    const validAttributes = { amIvalid: 'yes', 'are_you_sure': true, howMuch: 10, 'spell': ['1', '0'] };

    assert.equal(client.setAttributes(validAttributes), true, 'It should return true if it is valid.');
    assert.deepEqual(client.getAttributes(), validAttributes, 'It should be the same.');
    assert.equal(client.setAttribute('attrKey', 'attrValue'), true, 'It should return true.');
    assert.equal(client.getAttribute('attrKey'), 'attrValue', 'It should return true.');

    assert.equal(client.removeAttribute('attrKey'), true, 'It should return true.');
    assert.deepEqual(client.getAttributes(), validAttributes, 'It should be equal to the first set.');

    client.clearAttributes();

    const values = client.getAttributes();

    assert.equal(Object.keys(values).length, 0, 'It should be zero after clearing attributes');

    assert.end();
  });

  t.test('Should return false if it is an invalid attributes map', assert => {
    assert.equal(client.setAttribute('', 'attributeValue'), false, 'It should be invalid if the attribute key is not a string');
    assert.equal(client.setAttribute('attributeKey1', new Date()), false, 'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');
    assert.equal(client.setAttribute('attributeKey2', { 'some': 'object' }), false, 'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');
    assert.equal(client.setAttribute('attributeKey3', Infinity), false, 'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');

    client.clearAttributes();

    let values = client.getAttributes();

    assert.equal(Object.keys(values).length, 0, 'It should be zero after clearing attributes');

    let attributes = {
      'attributeKey': 'attributeValue',
      '': 'attributeValue'
    };

    assert.equal(client.setAttributes(attributes), false, 'It should be invalid if the attribute key is not a string');

    values = client.getAttributes();

    assert.equal(Object.keys(values).length, 0, 'It should be zero after trying to add an invalid attribute');

    client.clearAttributes();

    assert.end();
  });

  t.test('Should return true if attributes map is valid', assert => {
    const validAttributes = {
      'attributeKey1': 'attributeValue',
      'attributeKey2': ['attribute', 'value'],
      'attributeKey3': 25,
      'attributeKey4': false
    };

    assert.equals(client.setAttribute('attributeKey1', 'attributeValue'), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
    assert.equals(client.setAttribute('attributeKey2', ['attribute', 'value']), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
    assert.equals(client.setAttribute('attributeKey3', 25), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
    assert.equals(client.setAttribute('attributeKey4', false), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
    assert.equals(client.setAttribute('attributeKey5', Date.now()), true, 'It should be valid if the attribute value is a String, Number, Boolean or Lists.');

    assert.equals(client.removeAttribute('attributeKey5'), true, 'It should be capable of remove the attribute with that name');
    assert.deepEquals(client.getAttributes(), validAttributes, 'It should had stored every valid attributes.');

    client.clearAttributes();

    assert.equals(client.setAttributes(validAttributes), true, 'It should add them all because they are valid attributes.');
    assert.deepEquals(client.getAttributes(), validAttributes, 'It should had stored every valid attributes.');

    client.clearAttributes();

    assert.end();
  });

  t.end();
});

tape('ATTRIBUTES DECORATION / evaluation', t => {

  t.test('Evaluation attributes logic and precedence / getTreatment', assert => {

    // If the same attribute is “cached” and provided on the function, the value received on the function call takes precedence.
    assert.deepEquals(client.getTreatment('key', 'split'), undefined, 'Nothing changes if no attributes were provided using the new api');
    assert.deepEquals(client.getTreatment('key', 'split', { func_attr_bool: true, func_attr_str: 'true' }), { func_attr_bool: true, func_attr_str: 'true' }, 'Nothing changes if no attributes were provided using the new api');
    assert.deepEquals(client.getAttributes(), {}, 'Attributes in memory storage must be empty');
    client.setAttribute('func_attr_bool', false);
    assert.deepEquals(client.getAttributes(), { 'func_attr_bool': false }, 'In memory attribute storage must have the unique stored attribute');
    assert.deepEquals(client.getTreatment('key', 'split', { func_attr_bool: true, func_attr_str: 'true' }), { func_attr_bool: true, func_attr_str: 'true' }, 'Function attributes has precedence against api ones');
    assert.deepEquals(client.getTreatment('key', 'split', null), { func_attr_bool: false }, 'API attributes should be kept in memory and use for evaluations');
    assert.deepEquals(client.getTreatment('key', 'split', { func_attr_str: 'true' }), { func_attr_bool: false, func_attr_str: 'true' }, 'API attributes should be kept in memory and use for evaluations');
    client.setAttributes({ func_attr_str: 'false' });
    assert.deepEquals(client.getAttributes(), { 'func_attr_bool': false, 'func_attr_str': 'false' }, 'In memory attribute storage must have two stored attributes');
    assert.deepEquals(client.getTreatment('key', 'split', { func_attr_bool: true, func_attr_str: 'true', func_attr_number: 1 }), { func_attr_bool: true, func_attr_str: 'true', func_attr_number: 1 }, 'Function attributes has precedence against api ones');
    assert.deepEquals(client.getTreatment('key', 'split', null), { func_attr_bool: false, func_attr_str: 'false' }, 'If the getTreatment function is called without attributes, stored attributes will be used to evaluate.');
    assert.deepEquals(client.getTreatment('key', 'split'), { func_attr_bool: false, func_attr_str: 'false' }, 'If the getTreatment function is called without attributes, stored attributes will be used to evaluate.');
    client.clearAttributes();

    assert.end();
  });

  t.test('Evaluation attributes logic and precedence / getTreatments', assert => {

    // If the same attribute is “cached” and provided on the function, the value received on the function call takes precedence.
    assert.deepEquals(client.getTreatments('key', 'split'), undefined, 'Nothing changes if no attributes were provided using the new api');
    assert.deepEquals(client.getTreatments('key', 'split', { func_attr_bool: true, func_attr_str: 'true' }), { func_attr_bool: true, func_attr_str: 'true' }, 'Nothing changes if no attributes were provided using the new api');
    assert.deepEquals(client.getAttributes(), {}, 'Attributes in memory storage must be empty');
    client.setAttribute('func_attr_bool', false);
    assert.deepEquals(client.getAttributes(), { 'func_attr_bool': false }, 'In memory attribute storage must have the unique stored attribute');
    assert.deepEquals(client.getTreatments('key', 'split', { func_attr_bool: true, func_attr_str: 'true' }), { func_attr_bool: true, func_attr_str: 'true' }, 'Function attributes has precedence against api ones');
    assert.deepEquals(client.getTreatments('key', 'split', null), { func_attr_bool: false }, 'API attributes should be kept in memory and use for evaluations');
    assert.deepEquals(client.getTreatments('key', 'split', { func_attr_str: 'true' }), { func_attr_bool: false, func_attr_str: 'true' }, 'API attributes should be kept in memory and use for evaluations');
    client.setAttributes({ func_attr_str: 'false' });
    assert.deepEquals(client.getAttributes(), { 'func_attr_bool': false, 'func_attr_str': 'false' }, 'In memory attribute storage must have two stored attributes');
    assert.deepEquals(client.getTreatments('key', 'split', { func_attr_bool: true, func_attr_str: 'true', func_attr_number: 1 }), { func_attr_bool: true, func_attr_str: 'true', func_attr_number: 1 }, 'Function attributes has precedence against api ones');
    assert.deepEquals(client.getTreatments('key', 'split', null), { func_attr_bool: false, func_attr_str: 'false' }, 'If the getTreatment function is called without attributes, stored attributes will be used to evaluate.');
    assert.deepEquals(client.getTreatments('key', 'split'), { func_attr_bool: false, func_attr_str: 'false' }, 'If the getTreatment function is called without attributes, stored attributes will be used to evaluate.');
    client.clearAttributes();

    assert.end();

  });

  t.test('Evaluation attributes logic and precedence / getTreatmentWithConfig', assert => {

    // If the same attribute is “cached” and provided on the function, the value received on the function call takes precedence.
    assert.deepEquals(client.getTreatmentWithConfig('key', 'split'), undefined, 'Nothing changes if no attributes were provided using the new api');
    assert.deepEquals(client.getTreatmentWithConfig('key', 'split', { func_attr_bool: true, func_attr_str: 'true' }), { func_attr_bool: true, func_attr_str: 'true' }, 'Nothing changes if no attributes were provided using the new api');
    assert.deepEquals(client.getAttributes(), {}, 'Attributes in memory storage must be empty');
    client.setAttribute('func_attr_bool', false);
    assert.deepEquals(client.getAttributes(), { 'func_attr_bool': false }, 'In memory attribute storage must have the unique stored attribute');
    assert.deepEquals(client.getTreatmentWithConfig('key', 'split', { func_attr_bool: true, func_attr_str: 'true' }), { func_attr_bool: true, func_attr_str: 'true' }, 'Function attributes has precedence against api ones');
    assert.deepEquals(client.getTreatmentWithConfig('key', 'split', null), { func_attr_bool: false }, 'API attributes should be kept in memory and use for evaluations');
    assert.deepEquals(client.getTreatmentWithConfig('key', 'split', { func_attr_str: 'true' }), { func_attr_bool: false, func_attr_str: 'true' }, 'API attributes should be kept in memory and use for evaluations');
    client.setAttributes({ func_attr_str: 'false' });
    assert.deepEquals(client.getAttributes(), { 'func_attr_bool': false, 'func_attr_str': 'false' }, 'In memory attribute storage must have two stored attributes');
    assert.deepEquals(client.getTreatmentWithConfig('key', 'split', { func_attr_bool: true, func_attr_str: 'true', func_attr_number: 1 }), { func_attr_bool: true, func_attr_str: 'true', func_attr_number: 1 }, 'Function attributes has precedence against api ones');
    assert.deepEquals(client.getTreatmentWithConfig('key', 'split', null), { func_attr_bool: false, func_attr_str: 'false' }, 'If the getTreatment function is called without attributes, stored attributes will be used to evaluate.');
    assert.deepEquals(client.getTreatmentWithConfig('key', 'split'), { func_attr_bool: false, func_attr_str: 'false' }, 'If the getTreatment function is called without attributes, stored attributes will be used to evaluate.');
    client.clearAttributes();

    assert.end();

  });

  t.test('Evaluation attributes logic and precedence / getTreatmentsWithConfig', assert => {

    // If the same attribute is “cached” and provided on the function, the value received on the function call takes precedence.
    assert.deepEquals(client.getTreatmentsWithConfig('key', 'split'), undefined, 'Nothing changes if no attributes were provided using the new api');
    assert.deepEquals(client.getTreatmentsWithConfig('key', 'split', { func_attr_bool: true, func_attr_str: 'true' }), { func_attr_bool: true, func_attr_str: 'true' }, 'Nothing changes if no attributes were provided using the new api');
    assert.deepEquals(client.getAttributes(), {}, 'Attributes in memory storage must be empty');
    client.setAttribute('func_attr_bool', false);
    assert.deepEquals(client.getAttributes(), { 'func_attr_bool': false }, 'In memory attribute storage must have the unique stored attribute');
    assert.deepEquals(client.getTreatmentsWithConfig('key', 'split', { func_attr_bool: true, func_attr_str: 'true' }), { func_attr_bool: true, func_attr_str: 'true' }, 'Function attributes has precedence against api ones');
    assert.deepEquals(client.getTreatmentsWithConfig('key', 'split', null), { func_attr_bool: false }, 'API attributes should be kept in memory and use for evaluations');
    assert.deepEquals(client.getTreatmentsWithConfig('key', 'split', { func_attr_str: 'true' }), { func_attr_bool: false, func_attr_str: 'true' }, 'API attributes should be kept in memory and use for evaluations');
    client.setAttributes({ func_attr_str: 'false' });
    assert.deepEquals(client.getAttributes(), { 'func_attr_bool': false, 'func_attr_str': 'false' }, 'In memory attribute storage must have two stored attributes');
    assert.deepEquals(client.getTreatmentsWithConfig('key', 'split', { func_attr_bool: true, func_attr_str: 'true', func_attr_number: 1 }), { func_attr_bool: true, func_attr_str: 'true', func_attr_number: 1 }, 'Function attributes has precedence against api ones');
    assert.deepEquals(client.getTreatmentsWithConfig('key', 'split', null), { func_attr_bool: false, func_attr_str: 'false' }, 'If the getTreatment function is called without attributes, stored attributes will be used to evaluate.');
    assert.deepEquals(client.getTreatmentsWithConfig('key', 'split'), { func_attr_bool: false, func_attr_str: 'false' }, 'If the getTreatment function is called without attributes, stored attributes will be used to evaluate.');
    client.clearAttributes();

    assert.end();

  });

  t.end();
});
