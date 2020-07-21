/**
 * Set implementation based on es6-set polyfill (https://github.com/medikoo/es6-set/blob/master/polyfill.js),
 * with the minimal features used by the SDK.
 */
export class SetPoly {

  // unlike ES6 `Set`, it doesn't accept an iterable as first argument
  constructor() {
    this.__setData__ = [];
  }

  clear() {
    if (!this.__setData__.length) return;
    this.__setData__.length = 0;
  }

  add(value) {
    if (this.has(value)) return this;
    this.__setData__.push(value);
    return this;
  }

  delete(value) {
    var index = this.__setData__.indexOf(value);
    if (index === -1) return false;
    this.__setData__.splice(index, 1);
    return true;
  }

  has(value) {
    return this.__setData__.indexOf(value) !== -1;
  }

  forEach(cb/*, thisArg*/) {
    var thisArg = arguments[1];
    if (typeof cb !== 'function') throw new TypeError(cb + ' is not a function');

    for (let i = 0; i < this.__setData__.length; i++) {
      const value = this.__setData__[i];
      cb.call(thisArg, value, value, this);
    }
  }

  get size() {
    return this.__setData__.length;
  }

}

export function setToArray(set) {
  if (set instanceof SetPoly) {
    return set.__setData__.slice();
  }
  // if not using SetPoly as set, it means Array.from is supported
  return Array.from(set);
}

/**
 * return the Set constructor to use. If `Array.from` built-in or native Set is not available or it doesn't support the required features,
 * a ponyfill with minimal features is returned instead.
 */
function getSetConstructor() {
  if (!Array.from || !Set || !Set.prototype.values) {
    return SetPoly;
  }
  return Set;
}

export const _Set = getSetConstructor();