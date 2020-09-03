const TIME_INTERVAL_MS = 3600*1000;

class ImpressionCounter {
  constructor() {
    this.cache = {};
  }

  _truncateTimeFrame(timestampInMs) {
    return timestampInMs - (timestampInMs % TIME_INTERVAL_MS);
  }

  _makeKey(featureName, timeFrame) {
    return `${featureName}::${this._truncateTimeFrame(timeFrame)}`;
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
