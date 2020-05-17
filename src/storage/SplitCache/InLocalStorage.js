import { isFinite, toNumber } from '../../utils/lang';
import usesSegments from '../../utils/splits/usesSegments';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-storage:localstorage');
import killLocally from './killLocally';

class SplitCacheLocalStorage {

  constructor(keys) {
    this.keys = keys;
  }

  decrementCount(key) {
    const count = toNumber(localStorage.getItem(key)) - 1;

    if (count > 0) localStorage.setItem(key, count);
    else localStorage.removeItem(key);
  }

  decrementCounts(split) {
    try {
      if (split) {
        if (split.trafficTypeName) {
          const ttKey = this.keys.buildTrafficTypeKey(split.trafficTypeName);
          this.decrementCount(ttKey);
        }

        if (usesSegments(split.conditions)) {
          const segmentsCountKey = this.keys.buildSplitsWithSegmentCountKey();
          this.decrementCount(segmentsCountKey);
        }
      }
    } catch (e) {
      log.error(e);
    }
  }

  incrementCounts(split) {
    try {
      if (split) {
        if (split.trafficTypeName) {
          const ttKey = this.keys.buildTrafficTypeKey(split.trafficTypeName);
          localStorage.setItem(ttKey, toNumber(localStorage.getItem(ttKey)) + 1);
        }

        if (usesSegments(split.conditions)) {
          const segmentsCountKey = this.keys.buildSplitsWithSegmentCountKey();
          localStorage.setItem(segmentsCountKey, toNumber(localStorage.getItem(segmentsCountKey)) + 1);
        }
      }
    } catch (e) {
      log.error(e);
    }
  }

  addSplit(splitName , split) {
    try {
      const splitKey = this.keys.buildSplitKey(splitName);
      const splitFromLocalStorage = localStorage.getItem(splitKey);
      const previousSplit = splitFromLocalStorage ? JSON.parse(splitFromLocalStorage) : null;
      this.decrementCounts(previousSplit);

      localStorage.setItem(splitKey, split);

      const parsedSplit = split ? JSON.parse(split) : null;

      this.incrementCounts(parsedSplit);

      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  }

  addSplits(entries) {
    let results = [];

    for (const [key, value] of entries) {
      results.push(this.addSplit(key, value));
    }

    return results;
  }

  removeSplit(splitName) {
    try {
      const split = this.getSplit(splitName);
      localStorage.removeItem(this.keys.buildSplitKey(splitName));

      const parsedSplit = JSON.parse(split);
      this.decrementCounts(parsedSplit);

      return 1;
    } catch(e) {
      log.error(e);
      return 0;
    }
  }

  /**
   * Bulk delete of splits from LocalStorage. Returns the number of deleted keys.
   */
  removeSplits(names) {
    let i = 0;
    let len = names.length;
    let counter = 0;

    for (; i < len; i++) {
      counter += this.removeSplit(names[i]);
    }

    return counter;
  }

  getSplit(splitName) {
    return localStorage.getItem(this.keys.buildSplitKey(splitName));
  }

  setChangeNumber(changeNumber) {
    try {
      localStorage.setItem(this.keys.buildSplitsTillKey(), changeNumber + '');
      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  }

  getChangeNumber() {
    const n = -1;
    let value = localStorage.getItem(this.keys.buildSplitsTillKey());

    if (value !== null) {
      value = parseInt(value, 10);

      return Number.isNaN(value) ? n : value;
    }

    return n;
  }

  getAll() {
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

  getKeys() {
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

  trafficTypeExists(trafficType) {
    const ttCount = toNumber(localStorage.getItem(this.keys.buildTrafficTypeKey(trafficType)));
    return isFinite(ttCount) && ttCount > 0;
  }

  usesSegments() {
    // If there are no splits in the cache yet, assume we need them.
    if (this.getChangeNumber() === -1) return true;

    const storedCount = localStorage.getItem(this.keys.buildSplitsWithSegmentCountKey());
    const splitsWithSegmentsCount = storedCount === null ? 0 : toNumber(storedCount);

    if (isFinite(splitsWithSegmentsCount)) {
      return splitsWithSegmentsCount > 0;
    } else {
      return true;
    }
  }

  flush() {
    log.info('Flushing localStorage');
    localStorage.clear();
  }

  /**
   * Fetches multiple splits definitions.
   */
  fetchMany(splitNames) {
    const splits = new Map();
    splitNames.forEach(splitName => {
      splits.set(splitName, localStorage.getItem(this.keys.buildSplitKey(splitName)));
    });
    return splits;
  }

  /**
   * Check if the splits information is already stored in cache.
   * In this function we could add more code to check if the data is valid.
   */
  checkCache() {
    return this.getChangeNumber() > -1;
  }
}

SplitCacheLocalStorage.prototype.killLocally = killLocally;

export default SplitCacheLocalStorage;
