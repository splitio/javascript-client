class SplitCacheInMemory {

  constructor() {
    this.flush();
  }

  addSplit(splitName , split) {
    this.splitCache.set(splitName, split);

    return true;
  }

  addSplits(entries) {
    let results = [];

    for (const [key, value] of entries) {
      results.push(this.addSplit(key, value));
    }

    return results;
  }

  removeSplit(splitName) {
    this.splitCache.delete(splitName);

    return 1;
  }

  removeSplits(splitNames) {
    splitNames.forEach(n => this.splitCache.delete(n));

    return splitNames.length;
  }

  getSplit(splitName) {
    return this.splitCache.get(splitName);
  }

  setChangeNumber(changeNumber) {
    this.changeNumber = changeNumber;

    return true;
  }

  getChangeNumber() {
    return this.changeNumber;
  }

  getAll() {
    return [...this.splitCache.values()];
  }

  getKeys() {
    return [...this.splitCache.keys()];
  }

  flush() {
    this.splitCache = new Map;
    this.changeNumber = -1;
  }
}

export default SplitCacheInMemory;