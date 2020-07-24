import { numberIsFinite, toNumber, numberIsNaN } from '../../utils/lang';
import usesSegments from '../../utils/splits/usesSegments';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-storage:localstorage');
import killLocally from './killLocally';

class SplitCacheLocalStorage {

  constructor(keys, expirationTimestamp) {
    this.keys = keys;

    this.__checkExpiration(expirationTimestamp);
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

  addSplit(splitName, split) {
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

    entries.forEach(keyValuePair => {
      results.push(this.addSplit(keyValuePair[0], keyValuePair[1]));
    });

    return results;
  }

  removeSplit(splitName) {
    try {
      const split = this.getSplit(splitName);
      localStorage.removeItem(this.keys.buildSplitKey(splitName));

      const parsedSplit = JSON.parse(split);
      this.decrementCounts(parsedSplit);

      return 1;
    } catch (e) {
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
      // update "last updated" timestamp with current time
      localStorage.setItem(this.keys.buildLastUpdatedKey(), Date.now() + '');
      this.hasSync = true;
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

      return numberIsNaN(value) ? n : value;
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
    return numberIsFinite(ttCount) && ttCount > 0;
  }

  usesSegments() {
    // If cache hasn't been synchronized with the cloud, assume we need them.
    if (!this.hasSync) return true;

    const storedCount = localStorage.getItem(this.keys.buildSplitsWithSegmentCountKey());
    const splitsWithSegmentsCount = storedCount === null ? 0 : toNumber(storedCount);

    if (numberIsFinite(splitsWithSegmentsCount)) {
      return splitsWithSegmentsCount > 0;
    } else {
      return true;
    }
  }

  /**
   * Removes all splits cache related data from localStorage (splits, counters, changeNumber and lastUpdated).
   * We cannot simply call `localStorage.clear()` since that implies removing user items from the storage.
   */
  flush() {
    log.info('Flushing Splits data from localStorage');

    // collect item keys
    const len = localStorage.length;
    const accum = [];
    for (let cur = 0; cur < len; cur++) {
      const key = localStorage.key(cur);
      if (key != null && this.keys.isSplitCacheKey(key)) accum.push(key);
    }
    // remove items
    accum.forEach(key => {
      localStorage.removeItem(key);
    });

    this.hasSync = false;
  }

  /**
   * Fetches multiple splits definitions.
   */
  fetchMany(splitNames) {
    const splits = {};
    splitNames.forEach(splitName => {
      splits[splitName] = localStorage.getItem(this.keys.buildSplitKey(splitName));
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

  /**
   * Clean Splits cache if its `lastUpdated` timestamp is older than the given `expirationTimestamp`,
   * Clean operation (flush) also updates `lastUpdated` timestamp with current time.
   *
   * @param {number | undefined} expirationTimestamp if the value is not a number, data will not be cleaned
   */
  __checkExpiration(expirationTimestamp) {
    let value = localStorage.getItem(this.keys.buildLastUpdatedKey());
    if (value !== null) {
      value = parseInt(value, 10);
      if (!numberIsNaN(value) && value < expirationTimestamp) this.flush();
    }
  }
}

SplitCacheLocalStorage.prototype.killLocally = killLocally;

export default SplitCacheLocalStorage;
