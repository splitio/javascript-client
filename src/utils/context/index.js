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
const thenable = require('../promise/thenable');

class Context {
  constructor() {
    this.map = {};
  }
  /**
   * Gets an item in the context instance or a promise if the item is not yet stored.
   * @param {string} name - The name of the item we want to get
   */
  get(name) {
    if (typeof name !== 'string' || typeof name === 'string' && !name.length) {
      return; // Wrong usage, don't generate item promise.
    }
    const item = this.map[name];

    // If we have the item, return it.
    if (item !== undefined) {
      return item;
    } else { // If we don't, return a promise that we will resolve once we receive the item.
      let resolve;
      const promise = new Promise(res => resolve = res);
      promise.manualResolve = resolve;
      this.map[name] = promise;
      return promise;
    }
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

    // Item already exists and no one is waiting for the item. Abort and return false.
    if (existingItem !== undefined && typeof existingItem.manualResolve !== 'function') return false;

    // Someone is waiting for this item, resolve to it.
    if (thenable(existingItem) && existingItem.manualResolve) existingItem.manualResolve(item);

    // We are storing a promise, when resolving save the item. On error, clean up the item.
    if (thenable(item)) item.then(item => {
      this.map[name] = item;
      return item;
    }).catch(err => {
      this.map[name] = undefined;
      return err;
    });

    this.map[name] = item;
    return true;
  }
}

module.exports = Context;
