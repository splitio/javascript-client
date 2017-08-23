const thenable = require('../promise/thenable');

class Context {
  constructor() {
    this.map = {};
  }
  /**
   * Stores an item in the context instance.
   * @param {string} name - The name of what we are storing
   * @param {any} item - The item can be of any type.
   * @return {boolean}
   */
  put(name, item) {
    if (typeof name !== 'string' || (typeof name === 'string' && !name.length) || item === undefined) {
      return false; // We can't store this.
    }

    const existingItem = this.map[name];

    // Someone is waiting for this item, resolve to it.
    if (thenable(existingItem) && existingItem.manualResolve) {
      existingItem.manualResolve(item);
    } else {
      // Item already exists. Don't step on it.
      if (existingItem !== undefined) return false;
    }
    // We are storing a promise, when resolving save the value.
    if (thenable(item)) item.then((item) => {
      this.map[name] = item;
      return item;
    });

    this.map[name] = item;
    return true;
  }
  /**
   * Gets an item in the context instance.
   * @param {string} name - The name of the item we want to get
   */
  get(name) {
    if (typeof name !== 'string' || typeof name === 'string' && !name.length) {
      return;
    }
    const item = this.map[name];

    if (item !== undefined) {
      return item;
    } else {
      let resolve;
      const promise = new Promise(res => { resolve = res; });
      promise.manualResolve = resolve;
      this.map[name] = promise;
      return promise;
    }
  }
}








module.exports = Context;
