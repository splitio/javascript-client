/**
 * Set implementation based on es6-set polyfill (https://github.com/medikoo/es6-set/blob/master/polyfill.js),
 * with the minimal features used by the SDK.

Copyright (C) 2013 Mariusz Nowak (www.medikoo.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
**/

export class SetPoly {

  // unlike ES6 `Set`, it only accepts an array as first argument iterable
  constructor(/*arrayIterable*/) {
    this.__setData__ = [];
    const arrayIterable = arguments[0];
    if (Array.isArray(arrayIterable)) arrayIterable.forEach(value => { this.add(value); });
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
  // eslint-disable-next-line compat/compat
  return Array.from(set);
}

/**
 * return the Set constructor to use. If `Array.from` built-in or native Set is not available or it doesn't support the required features,
 * a ponyfill with minimal features is returned instead.
 */
function getSetConstructor() {
  // eslint-disable-next-line compat/compat
  if (typeof Array.from === 'function' && typeof Set === 'function' && Set.prototype && Set.prototype.values) {
    return Set;
  }
  return SetPoly;
}

export const _Set = getSetConstructor();
