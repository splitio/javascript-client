import { truncateTimeFrame } from '../utils/time';
import objectAssign from 'object-assign';

class ImpressionCounter {
  constructor() {
    this.cache = {};
  }

  /**
  * Builds key to be stored in the cache with the featureName and the timeFrame truncated.
  */
  _makeKey(featureName, timeFrame) {
    return `${featureName}::${truncateTimeFrame(timeFrame)}`;
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

  /**
  * Returns how many keys are stored in cache.
  */
  size() {
    return Object.keys(this.cache).length;
  }
}

export default ImpressionCounter;
