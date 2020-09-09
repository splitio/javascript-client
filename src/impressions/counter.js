import { truncateTimeFrame } from '../utils/time';
class ImpressionCounter {
  constructor() {
    this.cache = {};
  }

  _makeKey(featureName, timeFrame) {
    return `${featureName}::${truncateTimeFrame(timeFrame)}`;
  }

  inc(featureName, timeFrame, amount) {
    const key = this._makeKey(featureName, timeFrame);
    const currentAmount = this.cache[key];
    this.cache[key] = currentAmount ? currentAmount + amount : amount;
  }

  popAll() {
    const toReturn = {};
    Object.assign(toReturn, this.cache);
    this.cache = {};
    return toReturn;
  }
}

export default ImpressionCounter;
