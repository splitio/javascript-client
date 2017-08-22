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

    this.map[name] = item;
    return true;
  }

  get(name) {
    if (typeof name !== 'string' || typeof name === 'string' && !name.length) {
      return; // We can't store this.
    }

    return this.map[name];
  }
}








module.exports = Context;
