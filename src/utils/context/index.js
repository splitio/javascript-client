/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
import objectAssign from 'object-assign';
import thenable from '../promise/thenable';
import constants from './constants';

class Context {
  constructor() {
    this._map = {};
    this.constants = constants;
  }
  /**
   * Gets an item in the context instance or a promise if the item is not yet stored and we are not doing a one time check.
   * @param {String} name - The name of the item we want to get
   * @return {Any} The item we want to get.
   */
  get(name, flagCheck = false) {
    if (typeof name !== 'string' || typeof name === 'string' && !name.length) return; // Wrong usage, don't generate item promise.

    const item = this._map[name];

    // If we have the item, return it.
    if (item !== undefined) {
      return item;
    } else if (!flagCheck) { // If we don't and it's not a flag check, return a promise that we will resolve once we receive the item.
      let resolve;
      const promise = new Promise(res => resolve = res);
      promise.manualResolve = resolve;
      this._map[name] = promise;
      return promise;
    }
  }
  /**
   * Gets all objects stored in the context.
   * @return {Object} - A new map of context-stored items.
   */
  getAll() { return objectAssign({}, this._map); }
  /**
   * Stores an item in the context instance.
   * @param {String} name - The name of what we are storing
   * @param {Any} item - The item can be of any type.
   * @return {Boolean} - The result of the operation
   */
  put(name, item) {
    if (typeof name !== 'string' || (typeof name === 'string' && !name.length) || item === undefined) return false; // We can't store this.

    const existingItem = this._map[name];

    // Item already exists and no one is waiting for the item. Abort and return false.
    if (existingItem !== undefined && typeof existingItem.manualResolve !== 'function') return false;

    // Someone is waiting for this item, resolve to it.
    if (thenable(existingItem) && existingItem.manualResolve) existingItem.manualResolve(item);

    // We are storing a promise, when resolving save the item. On error, clean up the item.
    if (thenable(item)) {
      item.then(item => {
        this._map[name] = item;
        return item;
      }).catch(err => {
        this._map[name] = undefined;
        return err;
      });
    }

    this._map[name] = item;
    return true;
  }
}

export default Context;
