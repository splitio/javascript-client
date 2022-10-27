import { BloomFilter } from 'bloom-filters';

const EXPECTED_INSERTIONS = 10000000;
const ERROR_RATE = 0.01;
const REFRESH_RATE = 24 * 60 * 60000; // 24HS

export function bloomFilterFactory(expectedInsertions = EXPECTED_INSERTIONS, errorRate = ERROR_RATE, refreshRate = REFRESH_RATE) {
  let filter = BloomFilter.create(expectedInsertions, errorRate);

  return {

    refreshRate: refreshRate,

    add(key, value) {
      const data = `${key}:${value}`;
      if (filter.has(data)) {
        return false;
      }
      filter.add(data);
      return true;
    },

    contains(key, value) {
      const data = `${key}:${value}`;
      return filter.has(data);
    },

    clear() {
      filter = BloomFilter.create(expectedInsertions, errorRate);
    }

  };
}
