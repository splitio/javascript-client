// @flow

'use strict';

const log = require('../../utils/logger')('splitio-storage:localstorage');

class SplitCacheLocalStorage {
  keys: KeyBuilder;

  constructor(keys: KeyBuilder) {
    this.keys = keys;
  }

  addSplit(splitName: string , split: string): boolean {
    try {
      localStorage.setItem(this.keys.buildSplitKey(splitName), split);
      return true;
    } catch (e) {
      log.error(e);
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
      localStorage.removeItem(this.keys.buildSplitKey(splitName));
      return 1;
    } catch(e) {
      log.error(e);
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
    return localStorage.getItem(this.keys.buildSplitKey(splitName));
  }

  setChangeNumber(changeNumber: number): boolean {
    try {
      localStorage.setItem(this.keys.buildSplitsTillKey(), changeNumber + '');
      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  }

  getChangeNumber(): number {
    const n = -1;
    let value = localStorage.getItem(this.keys.buildSplitsTillKey());

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

      if (key != null && this.keys.isSplitKey(key) && value) accum.push(value);

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

      if (key != null && this.keys.isSplitKey(key)) accum.push(this.keys.extractKey(key));

      cur++;
    }

    return accum;
  }

  flush() {
    // @TODO improve implementation
    localStorage.clear();
  }
}

module.exports = SplitCacheLocalStorage;
