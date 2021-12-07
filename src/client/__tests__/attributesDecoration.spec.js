import tape from 'tape-catch';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();

const inputValidation = sinon.stub();
inputValidation.resolves({});

const AttributesDecorationMockedClient = proxyquireStrict(
  '../attributesDecoration',
  {
    './inputValidation': inputValidation
  }
).default;


tape('ATTRIBUTES DECORATION / storage', assert => {

  const client = AttributesDecorationMockedClient({});

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
