import { BloomFilter } from '@ably/bloomit';

export function getBloomFilter(expectedInsertions = 10000000, errorRate = 0.01) {
  let filter = BloomFilter.create(expectedInsertions, errorRate);
  
  return {  
  
    add(data) {
      try {
        filter.add(data);
        return true;
      } catch(error){
        return false;
      }
    },
  
    contains(data) {
      return filter.has(data);
    },
  
    clear() {
      filter = BloomFilter.create(expectedInsertions, errorRate);
    }
  
  };
}
