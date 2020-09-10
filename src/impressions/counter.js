import objectAssign from 'object-assign';

const DEDUP_WINDOW_SIZE_MS = 3600*1000; // Time window for deduping impressions

class ImpressionCounter {
  constructor() {
    this.cache = {};
  }

  /**
  * Truncates de time frame received with the time window.
  */
  _truncateTimeFrame(timestampInMs) {
    return timestampInMs - (timestampInMs % DEDUP_WINDOW_SIZE_MS);
  }

  /**
  * Builds key to be stored in the cache with the featureName and the timeFrame truncated.
  */
  _makeKey(featureName, timeFrame) {
    return `${featureName}::${this._truncateTimeFrame(timeFrame)}`;
  }

  /**
  * Increments the quantity of impressions with the passed featureName and timeFrame.
  */
  inc(featureName, timeFrame, amount) {
    const key = this._makeKey(featureName, timeFrame);
    const currentAmount = this.cache[key];
    this.cache[key] = currentAmount ? currentAmount + amount : amount;
  }

  /**
  * Returns all the elements stored in the cache and resets the cache.
  */
  popAll() {
    const res = {};
    objectAssign(res, this.cache);
    this.cache = {};
    return res;
  }
}

export default ImpressionCounter;
