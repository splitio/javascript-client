// @flow

'use strict';

const log = require('debug')('splitio-storage:localstorage');

const keys = require('../Keys');

class SplitCacheLocalStorage {

  addSplit(splitName: string , split: string): boolean {
    try {
      localStorage.setItem(keys.buildSplitKey(splitName), split);
      return true;
    } catch (e) {
      log(e);
      return false;
    }
  }

  addSplits(entries: Array<[string, string]>): Array<boolean> {
    let results = [];

    for (const [key, value] of entries) {
      results.push(this.addSplit(key, value));
    }

    return results;
  }

  removeSplit(splitName: string): number {
    try {
      localStorage.removeItem(keys.buildSplitKey(splitName));
      return 1;
    } catch(e) {
      log(e);
      return 0;
    }
  }

  /**
   * Bulk delete of splits from LocalStorage. Returns the number of deleted keys.
   */
  removeSplits(names: Array<string>): number {
    let i = 0;
    let len = names.length;
    let counter = 0;

    for (; i < len; i++) {
      counter += this.removeSplit(names[i]);
    }

    return counter;
  }

  getSplit(splitName: string): ?string {
    return localStorage.getItem(keys.buildSplitKey(splitName));
  }

  setChangeNumber(changeNumber: number): boolean {
    try {
      localStorage.setItem(keys.buildSplitsTillKey(), changeNumber + '');
      return true;
    } catch (e) {
      log(e);
      return false;
    }
  }

  getChangeNumber(): number {
    const n = -1;
    let value = localStorage.getItem(keys.buildSplitsTillKey());

    if (value !== null) {
      value = parseInt(value, 10);

      return Number.isNaN(value) ? n : value;
    }

    return n;
  }

  getAll(): Array<string> {
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

  getKeys(): Array<string> {
    const len = localStorage.length;
    const accum = [];

    let cur = 0;

    while (cur < len) {
      const key = localStorage.key(cur);

      if (key != null && keys.isSplitKey(key)) {
        accum.push( keys.extractKey(key) );
      }
    }

    return accum;
  }

  flush() {
    localStorage.clear();
  }
}

module.exports = SplitCacheLocalStorage;
