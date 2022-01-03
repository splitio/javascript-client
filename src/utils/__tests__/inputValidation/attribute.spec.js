import tape from 'tape-catch';
import { validateAttribute } from '../../inputValidation/attribute';

tape('INPUT VALIDATION for Attribute', assert => {
  assert.equals(validateAttribute(2, 'dos', 'some_method_attrs'),false,'It should be invalid if the attribute key is not a string');
  assert.equals(validateAttribute('', 'empty', 'some_method_attrs'),false,'It should be invalid if the attribute key is not a string');
  assert.equals(validateAttribute(null, 'null', 'some_method_attrs'),false,'It should be invalid if the attribute key is not a string');
  assert.equals(validateAttribute(true, 'boolean', 'some_method_attrs'),false,'It should be invalid if the attribute key is not a string');
  assert.equals(validateAttribute({'some':'object'}, 'object', 'some_method_attrs'),false,'It should be invalid if the attribute key is not a string');

  assert.equals(validateAttribute('attributeKey', new Date(), 'some_method_attrs'),false,'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');
  assert.equals(validateAttribute('attributeKey', {'some':'object'}),false,'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');
  assert.equals(validateAttribute('attributeKey', Infinity),false,'It should be invalid if the attribute value is not a String, Number, Boolean or Lists.');

  assert.equals(validateAttribute('attributeKey', 'attributeValue'),true,'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
  assert.equals(validateAttribute('attributeKey', ['attribute','value']),true,'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
  assert.equals(validateAttribute('attributeKey', 25),true,'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
  assert.equals(validateAttribute('attributeKey', false),true,'It should be valid if the attribute value is a String, Number, Boolean or Lists.');
  assert.equals(validateAttribute('attributeKey', Date.now()),true,'It should be valid if the attribute value is a String, Number, Boolean or Lists.');

  assert.end();
});
