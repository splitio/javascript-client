// @flow

'use strict';

const keys = require('../Keys');
const SplitCacheInMemory = require('./InMemory');

class SplitCacheLocalStorage {

  addSplit(splitName: string , split: string): boolean {
    try {
      localStorage.setItem(keys.buildSplitKey(splitName), split);
      return true;
    } catch (e) {
      return false;
    }
  }

  removeSplit(splitName: string): number {
    try {
      localStorage.removeItem(keys.buildSplitKey(splitName));
      return 1;
    } catch(e) {
      return 0;
    }
  }

  getSplit(splitName: string): ?string {
    return localStorage.getItem(keys.buildSplitKey(splitName));
  }

  setChangeNumber(changeNumber: number): boolean {
    try {
      localStorage.setItem(keys.buildSplitsTillKey(), changeNumber + '');
      return true;
    } catch (e) {
      return false;
    }
  }

  getChangeNumber(): ?number {
    let value = localStorage.getItem(keys.buildSplitsTillKey());

    if (value !== null) {
      value = parseInt(value, 10);

      return Number.isNaN(value) ? null : value;
    }

    return null;
  }

  getAll(): Iterable<string> {
    const len = localStorage.length;
    const accum = [];

    let cur = 0;

    while (cur < len) {
      const key = localStorage.key(cur);
      const value = key && localStorage.getItem(key);

      if (key != null && keys.isSplitKey(key) && value)
        accum.push( value );

      cur++;
    }

    return accum;
  }
}

module.exports = SplitCacheLocalStorage;
