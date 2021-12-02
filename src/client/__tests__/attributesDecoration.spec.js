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

  assert.true(values['attributeName1'] === 'attributeValue1');
  assert.true(values['attributeName2'] === 'attributeValue2');

  client.removeAttribute('attributeName1');

  assert.true(client.getAttribute('attributeName1') === undefined);
  assert.true(client.getAttribute('attributeName2') === 'attributeValue2');

  client.setAttributes({
    'attributeName3': 'attributeValue3',
    'attributeName4': 'attributeValue4'
  });

  assert.true(client.getAttribute('attributeName2') === 'attributeValue2');
  assert.true(client.getAttribute('attributeName3') === 'attributeValue3');
  assert.true(client.getAttribute('attributeName4') === 'attributeValue4');

  client.clearAttributes();

  values = client.getAttributes();

  assert.true(values['attributeName2'] === undefined);
  assert.true(values['attributeName3'] === undefined);
  assert.true(values['attributeName4'] === undefined);

  assert.end();
});