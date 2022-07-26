import { BloomFilter } from '@ably/bloomit';

const EXPECTED_INSERTIONS = 10000000;
const ERROR_RATE = 0.01;

export function bloomFilterFactory(expectedInsertions = EXPECTED_INSERTIONS, errorRate = ERROR_RATE) {
  let filter = BloomFilter.create(expectedInsertions, errorRate);
  
  return {  
  
    add(data) {
      if (filter.has(data)) return false;
      filter.add(data);
      return true;
    },
  
    contains(data) {
      return filter.has(data);
    },
  
    clear() {
      filter = BloomFilter.create(expectedInsertions, errorRate);
    }
  
  };
}
