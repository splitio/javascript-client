import { BloomFilter } from '@ably/bloomit';

export function getBloomFilter(spectedInsertions, errorRate) {
  let __spectedInsertions = 10000000; // 10.000.000 default size
  let __errorRate = 0.01; // 0,01 default error rate
  let __filter;
  
  if (spectedInsertions) __spectedInsertions = spectedInsertions;
  if (errorRate) __errorRate = errorRate;
  __filter = BloomFilter.create(__spectedInsertions, __errorRate);
  
  return {  
  
    add: (data) => {
      try {
        __filter.add(data);
        return true;
      } catch(error){
        return false;
      }
    },
  
    contains: (data) => {
      return __filter.has(data);
    },
  
    clear: () => {
      __filter = BloomFilter.create(__spectedInsertions, __errorRate);
    }
  
  };
}
