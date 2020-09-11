import LRU from 'lru-cache';

class ImpressionObserver {
  constructor(size, hasher) {
    this.cache = new LRU({
      max: size,
    });
    this.hasher = hasher;
  }

  testAndSet(impression) {
    if (!impression) return null;

    const hash = this.hasher(impression);
    const previous = this.cache.get(hash);
    this.cache.set(hash, impression.time);
    return previous;
  }
}

export default ImpressionObserver;
