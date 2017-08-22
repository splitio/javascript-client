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
    // Item already exists. Don't step on it.
    if (existingItem) return false;
    // Someone is waiting for this item, resolve to it.
    if (thenable(existingItem) && existingItem.manualResolve) this.map[name].manualResolve(item);
    // We are storing a promise, when resolving save the value.
    if (thenable(item)) item.then((item) => {
      this.map[name] = item;
      return item;
    });

    this.map[name] = item;
    return true;
  }

  get(name) {
    if (typeof name !== 'string' || typeof name === 'string' && !name.length) {
      return; // We can't store this.
    }
    const item = this.map[name];

    if (item !== undefined) {
      return item;
    } else {
      let resolve;
      this.map[name] = new Promise((res) => { resolve = res; });
      this.map[name].manualResolve = resolve;
      return this.map[name];
    }
  }
}








module.exports = Context;
