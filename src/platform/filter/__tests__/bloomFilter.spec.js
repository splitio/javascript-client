import tape from 'tape-catch';
import { bloomFilterFactory } from '../bloomFilter';

tape('Bloom filter', (assert) => {
  
  const bloomFilter = bloomFilterFactory();
  
  assert.true(bloomFilter.add('test1'));
  assert.false(bloomFilter.contains('test2'));
  assert.true(bloomFilter.contains('test1'));
  
  bloomFilter.clear();
  
  assert.false(bloomFilter.contains('test1'));
  
  assert.true(bloomFilter.add('test3'));
  assert.false(bloomFilter.contains('test4'));
  assert.true(bloomFilter.contains('test3'));
  
  assert.end();
  
});
