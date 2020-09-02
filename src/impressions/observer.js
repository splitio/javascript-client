import LRU from 'lru-cache';
import hashImpression from './hasher';

class ImpressionObserver {
  constructor(size) {
    this.cache = new LRU({
      max: size,
    });
  }

  testAndSet(impression) {
    if (!impression) {
      return null;
    }

    const hash = hashImpression(impression);
    const previous = this.cache.get(hash);
    this.cache.set(hash, impression.time);
    return previous ? previous : null;
  }
}

export default ImpressionObserver;