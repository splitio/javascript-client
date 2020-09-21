import { LinkedList, Node } from './linkedlist';

const _Map = typeof Map !== 'undefined' ? Map : class MapPoly { // @TODO move this util into its own file
  constructor() { }
  set(key, value) { this[key] = value; }
  get(key) { return this[key]; }
  delete(key) { delete this[key]; }
  get size() { return Object.keys(this).length; }
};

class LRUCache {
  constructor(maxSize) {
    this.maxLen = maxSize || 1;
    this.items = new _Map();
    this.lru = new LinkedList();
  }

  get(key) {
    const node = this.items.get(key);
    if (!node || !(node instanceof Node)) return undefined;

    this.lru.unshiftNode(node); // Move to front

    return node.value.value;
  }

  set(key, value) {
    const node = this.items.get(key);
    
    if (node) {
      if (!(node instanceof Node)) return false;
      this.lru.unshiftNode(node); // Move to front
      this.lru.head.value.value = value; // Update value
    } else {
      if (this.lru.length === this.maxLen) {  // Remove last
        const last = this.lru.tail;
        if (!last) return false;
        this.items.delete(last.value.key);
        this.lru.removeNode(this.lru.tail); // Remove node
      }

      this.lru.unshift({ key, value }); // Push front
      this.items.set(key, this.lru.head);
    }
    return true;
  }
}

export default LRUCache;
