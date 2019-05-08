import { isFinite } from '../../utils/lang';

class SplitCacheInMemory {

  constructor() {
    this.flush();
  }

  addSplit(splitName , split) {
    this.splitCache.set(splitName, split);

    const ttName = split.trafficTypeName;
    if (ttName) { // safeguard
      if (!this.ttCache[ttName]) this.ttCache[ttName] = 0;
      this.ttCache[ttName]++;
    }

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
    const split = this.getSplit(splitName);
    const ttName = split.trafficTypeName;

    this.splitCache.delete(splitName);

    if (ttName) { // safeguard
      this.ttCache[ttName]--;
      if (!this.ttCache[ttName]) delete this.ttCache[ttName];
    }

    return 1;
  }

  removeSplits(splitNames) {
    splitNames.forEach(n => this.removeSplit(n));

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

  trafficTypeExists(trafficType) {
    return isFinite(this.ttCache[trafficType]) && this.ttCache[trafficType] > 0;
  }

  flush() {
    this.splitCache = new Map;
    this.ttCache = {};
    this.changeNumber = -1;
  }
}

export default SplitCacheInMemory;
