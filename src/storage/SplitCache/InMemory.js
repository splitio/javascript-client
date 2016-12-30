// @flow

'use strict';

const keys = require('../Keys');

class SplitCacheInMemory {
  splitCache: Map<string, string>;
  changeNumber: number;

  constructor() {
    this.splitCache = new Map;
    this.changeNumber = -1;
  }

  addSplit(splitName: string , split: string): boolean {
    this.splitCache.set(keys.buildSplitKey(splitName), split);

    return true;
  }

  addSplits(splitNames: Array<string>, splits: Array<string>): Array<boolean> {
    let i = 0;
    let namesLen = splitNames.length;
    let splitsLen = splits.length;
    let results = [];

    while ( i < namesLen && i < splitsLen) {
      results.push(this.addSplit(splitNames[i], splits[i]));
      i++;
    }

    return results;
  }

  removeSplit(splitName: string): number {
    this.splitCache.delete(keys.buildSplitKey(splitName));

    return 1;
  }

  getSplit(splitName: string): ?string {
    return this.splitCache.get(keys.buildSplitKey(splitName));
  }

  setChangeNumber(changeNumber: number): boolean {
    this.changeNumber = changeNumber;

    return true;
  }

  getChangeNumber(): number {
    return this.changeNumber;
  }

  getAll(): Iterator<string> {
    return this.splitCache.values();
  }
}

module.exports = SplitCacheInMemory;
