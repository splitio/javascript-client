import { isFinite, toNumber } from '../../utils/lang';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-storage:localstorage');


class SplitCacheLocalStorage {

  constructor(keys) {
    this.keys = keys;
  }

  decrementTrafficType(split) {
    try {
      if (split && split.trafficTypeName) {
        const ttKey = this.keys.buildTrafficTypeKey(split.trafficTypeName);
        const count = toNumber(localStorage.getItem(ttKey)) - 1;
        if (count > 0) localStorage.setItem(ttKey, count);
        else localStorage.removeItem(ttKey);
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
      this.decrementTrafficType(previousSplit);

      localStorage.setItem(splitKey, split);

      const parsedSplit = split ? JSON.parse(split) : null;
      if (parsedSplit && parsedSplit.trafficTypeName) {
        const ttKey = this.keys.buildTrafficTypeKey(parsedSplit.trafficTypeName);
        localStorage.setItem(ttKey, toNumber(localStorage.getItem(ttKey)) + 1);
      }

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
      this.decrementTrafficType(parsedSplit);

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

  flush() {
    log.info('Flushing localStorage');
    localStorage.clear();
  }
}

export default SplitCacheLocalStorage;
