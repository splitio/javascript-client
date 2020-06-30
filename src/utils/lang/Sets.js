/**
 * Set implementation based on JS objects.
 * Only support string type as items
 */
export class ObjectSet {

  constructor(items) {
    this.clear();
    if (Array.isArray(items)) {
      items.forEach((item) => {
        this.add(item);
      });
    }
  }

  clear() {
    this.items = {};
  }

  add(item) {
    this.items[item] = true;
    return this;
  }

  // unlike `Set.prototype.delete`, it doesn't return a boolean indicating if the item was deleted or not
  delete(item) {
    delete this.items[item];
  }

  has(item) {
    return this.items[item] !== undefined;
  }

  values() {
    return Object.keys(this.items);
  }

}

/**
 * Set implementation based on JS arrays.
 * Support any object type as items
 */
export class ArraySet {

  // unlike `Set`, it doesn't accept an iterable as first argument
  constructor() {
    this.clear();
  }

  clear() {
    this.items = [];
  }

  add(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items[index] = item;
    } else {
      this.items.push(item);
    }
    return this;
  }

  // unlike `Set.prototype.delete`, it doesn't return a boolean indicating if the item was deleted or not
  delete(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }

  has(item) {
    return this.items.indexOf(item) > -1;
  }

  values() {
    return this.items;
  }

  // Unlike `Set`, it exposes a `size` instance method instead of a property
  size() {
    return this.items.length;
  }

}