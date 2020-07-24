import { numberIsFinite } from '../../utils/lang';
import usesSegments from '../../utils/splits/usesSegments';
import killLocally from './killLocally';

class SplitCacheInMemory {

  constructor() {
    this.flush();
  }

  addSplit(splitName, split) {
    const splitFromMemory = this.getSplit(splitName);
    if (splitFromMemory) { // We had this Split already
      const previousSplit = JSON.parse(splitFromMemory);

      if (previousSplit.trafficTypeName) {
        const previousTtName = previousSplit.trafficTypeName;
        this.ttCache[previousTtName]--;
        if (!this.ttCache[previousTtName]) delete this.ttCache[previousTtName];
      }

      if (usesSegments(previousSplit.conditions)) { // Substract from segments count for the previous version of this Split.
        this.splitsWithSegmentsCount--;
      }
    }

    const parsedSplit = JSON.parse(split);

    if (parsedSplit) {
      // Store the Split.
      this.splitCache[splitName] = split;
      // Update TT cache
      const ttName = parsedSplit.trafficTypeName;
      if (ttName) { // safeguard
        if (!this.ttCache[ttName]) this.ttCache[ttName] = 0;
        this.ttCache[ttName]++;
      }

      // Add to segments count for the new version of the Split
      if (usesSegments(parsedSplit.conditions)) this.splitsWithSegmentsCount++;

      return true;
    } else {
      return false;
    }
  }

  addSplits(entries) {
    let results = [];

    entries.forEach(keyValuePair => {
      results.push(this.addSplit(keyValuePair[0], keyValuePair[1]));
    });

    return results;
  }

  removeSplit(splitName) {
    const split = this.getSplit(splitName);
    if (split) {
      // Delete the Split
      delete this.splitCache[splitName];

      const parsedSplit = JSON.parse(split);
      const ttName = parsedSplit.trafficTypeName;

      if (ttName) { // safeguard
        this.ttCache[ttName]--; // Update tt cache
        if (!this.ttCache[ttName]) delete this.ttCache[ttName];
      }

      // Update the segments count.
      if (usesSegments(parsedSplit.conditions)) this.splitsWithSegmentsCount--;

      return 1;
    } else {
      return 0;
    }
  }

  removeSplits(splitNames) {
    splitNames.forEach(n => this.removeSplit(n));

    return splitNames.length;
  }

  getSplit(splitName) {
    return this.splitCache[splitName];
  }

  setChangeNumber(changeNumber) {
    this.changeNumber = changeNumber;

    return true;
  }

  getChangeNumber() {
    return this.changeNumber;
  }

  getAll() {
    return this.getKeys().map(key => this.splitCache[key]);
  }

  getKeys() {
    return Object.keys(this.splitCache);
  }

  trafficTypeExists(trafficType) {
    return numberIsFinite(this.ttCache[trafficType]) && this.ttCache[trafficType] > 0;
  }

  usesSegments() {
    return this.getChangeNumber() === -1 || this.splitsWithSegmentsCount > 0;
  }

  flush() {
    this.splitCache = {};
    this.ttCache = {};
    this.changeNumber = -1;
    this.splitsWithSegmentsCount = 0;
  }

  /**
   * Fetches multiple splits definitions.
   */
  fetchMany(splitNames) {
    const splits = {};
    splitNames.forEach(splitName => {
      splits[splitName] = this.splitCache[splitName] || null;
    });
    return splits;
  }

  /**
   * Check if the splits information is already stored in cache. In memory there is no cache to check.
   */
  checkCache() {
    return false;
  }
}

SplitCacheInMemory.prototype.killLocally = killLocally;

export default SplitCacheInMemory;
