import LRU from '../../utils/lrucache/lrucache';

class ImpressionObserver {
  constructor(size, hasher) {
    this.cache = new LRU(size);
    this.hasher = hasher;
  }

  testAndSet(impression) {
    const hash = this.hasher(impression);
    const previous = this.cache.get(hash);
    this.cache.set(hash, impression.time);
    return previous;
  }
}

export default ImpressionObserver;
