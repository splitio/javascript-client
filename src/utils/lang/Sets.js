/**
 * Set implementation based on JS arrays, with the minimal features used by the SDK and supported by IE11 Set.
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

  // unlike `Set.prototype.add`, it doesn't return the object itself
  add(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items[index] = item;
    } else {
      this.items.push(item);
    }
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

  forEach() {
    return this.items.forEach(arguments);
  }

  get size() {
    return this.items.length;
  }

}

export function setToArray(set) {
  if(Array.from) return Array.from(set);

  const result = [];
  // using `Set.prototype.forEach` since it is well supported, while `values`, `entries` and `keys` methods are not
  set.forEach(item => {
    result.push(item);
  });
  return result;
}

export const _Set = Set || ArraySet;