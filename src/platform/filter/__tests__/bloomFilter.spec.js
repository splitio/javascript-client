import tape from 'tape-catch';
import { bloomFilterFactory } from '../bloomFilter';

tape('Bloom filter', (assert) => {
  
  const bloomFilter = bloomFilterFactory();
  
  assert.true(bloomFilter.add('feature','key'));
  assert.false(bloomFilter.contains('feature1','key'));
  assert.true(bloomFilter.contains('feature','key'));
  
  bloomFilter.clear();
  
  assert.false(bloomFilter.contains('feature','key'));
  
  assert.true(bloomFilter.add('feature2','key'));
  assert.false(bloomFilter.contains('feature3','key'));
  assert.true(bloomFilter.contains('feature2','key'));
  
  assert.end();
  
});
