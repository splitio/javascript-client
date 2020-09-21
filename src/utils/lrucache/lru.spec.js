import tape from 'tape-catch';
import LRUCache from './lrucache';

tape('Check Cache', assert => {
  const cache = new LRUCache(5, 1000);
  for (let i = 1; i <= 5; i++) {
    assert.equal(cache.set(`key${i}`, i), true);
  }

  for (let i = 1; i <= 5; i++) {
    assert.equal( cache.get(`key${i}`), i);
  }

  cache.set('key6', 6);
  // Oldest item (1) should have been removed
  assert.equal(cache.get('key1'), undefined);

  // 2-6 should be available
  for (let i = 2; i <= 6; i++) {
    assert.equal(cache.get(`key${i}`), i);
  }

  assert.equal(cache.items.size, 5);

  assert.end();
});
