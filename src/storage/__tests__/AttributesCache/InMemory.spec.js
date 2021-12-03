import tape from 'tape-catch';
import AttributesCacheInMemory from '../../AttributesCache/InMemory';

tape('ATTRIBUTE CACHE / In Memory', assert => {
  const cache = new AttributesCacheInMemory();

  cache.setAttribute('attributeName1', 'attributeValue1');
  cache.setAttribute('attributeName2', 'attributeValue2');

  let values = cache.getAll();

  assert.equal(values['attributeName1'], 'attributeValue1', 'It should be equal');
  assert.equal(values['attributeName2'], 'attributeValue2', 'It should be equal');

  cache.removeAttribute('attributeName1');

  assert.equal(cache.getAttribute('attributeName1'), undefined, 'It should throw undefined');
  assert.equal(cache.getAttribute('attributeName2'), 'attributeValue2', 'It should be equal');

  cache.setAttributes({
    'attributeName3': 'attributeValue3',
    'attributeName4': 'attributeValue4'
  });

  assert.equal(values['attributeName2'], 'attributeValue2', 'It should be equal');
  assert.equal(values['attributeName3'], 'attributeValue3', 'It should be equal');
  assert.equal(values['attributeName4'], 'attributeValue4', 'It should be equal');

  cache.clear();

  values = cache.getAll();

  assert.equal(Object.keys(values).length, 0, 'It should be zero after clearing attributes');

  assert.end();
});
