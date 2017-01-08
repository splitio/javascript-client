// @flow

'use strict';

class SplitCacheInMemory {
  splitCache: Map<string, string>;
  changeNumber: number;

  constructor() {
    this.splitCache = new Map;
    this.changeNumber = -1;
  }

  addSplit(splitName: string , split: string): boolean {
    this.splitCache.set(splitName, split);

    return true;
  }

  addSplits(entries: Array<[string, string]>): Array<boolean> {
    let results = [];

    for (const [key, value] of entries) {
      results.push(this.addSplit(key, value));
    }

    return results;
  }

  removeSplit(splitName: string): number {
    this.splitCache.delete(splitName);

    return 1;
  }

  removeSplits(splitNames: Array<string>): number {
    splitNames.forEach(n => this.splitCache.delete(n));

    return splitNames.length;
  }

  getSplit(splitName: string): ?string {
    return this.splitCache.get(splitName);
  }

  setChangeNumber(changeNumber: number): boolean {
    this.changeNumber = changeNumber;

    return true;
  }

  getChangeNumber(): number {
    return this.changeNumber;
  }

  getAll(): Array<string> {
    return [...this.splitCache.values()];
  }

  getKeys(): Array<string> {
    return [...this.splitCache.keys()];
  }
}

module.exports = SplitCacheInMemory;
