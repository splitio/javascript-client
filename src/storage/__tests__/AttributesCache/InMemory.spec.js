import tape from 'tape-catch';
import AttributesCacheInMemory from '../../AttributesCache/InMemory';

tape('ATTRIBUTE CACHE / In Memory', assert => {
  const cache = new AttributesCacheInMemory();

  cache.setAttribute('attributeName1', 'attributeValue1');
  cache.setAttribute('attributeName2', 'attributeValue2');


  let values = cache.getAll();

  assert.true(values['attributeName1'] === 'attributeValue1');
  assert.true(values['attributeName2'] === 'attributeValue2');

  cache.removeAttribute('attributeName1');

  assert.true(cache.getAttribute('attributeName1') === undefined);
  assert.true(cache.getAttribute('attributeName2') === 'attributeValue2');

  cache.setAttributes({
    'attributeName3': 'attributeValue3',
    'attributeName4': 'attributeValue4'
  });

  assert.true(cache.getAttribute('attributeName2') === 'attributeValue2');
  assert.true(cache.getAttribute('attributeName3') === 'attributeValue3');
  assert.true(cache.getAttribute('attributeName4') === 'attributeValue4');

  cache.clear();

  values = cache.getAll();

  assert.true(values['attributeName2'] === undefined);
  assert.true(values['attributeName3'] === undefined);
  assert.true(values['attributeName4'] === undefined);

  assert.end();
});