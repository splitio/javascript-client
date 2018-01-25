/**
 * Discard errors for an answer of multiple operations.
 */
const processPipelineAnswer = (results) =>
  results.reduce((accum, [err, value]) => {
    if (err === null) accum.push(value);
    return accum;
  }, []);

class SplitCacheInRedis {

  constructor(keys, redis) {
    this.redis = redis;
    this.keys = keys;
  }

  addSplit(splitName, split) {
    return this.redis.set(
      this.keys.buildSplitKey(splitName), split
    ).then(
      status => status === 'OK'
    );
  }

  addSplits(entries) {
    if (entries.length) {
      const cmds = entries.map(([key, value]) => ['set', this.keys.buildSplitKey(key), value]);

      return this.redis.pipeline(cmds)
        .exec()
        .then(processPipelineAnswer)
        .then(answers => answers.map(status => status === 'OK'));
    } else {
      return [true];
    }
  }

  /**
   * Remove a given split from Redis. Returns the number of deleted keys.
   */
  removeSplit(splitName) {
    return this.redis.del(this.keys.buildSplitKey(splitName));
  }

  /**
   * Bulk delete of splits from Redis. Returns the number of deleted keys.
   */
  removeSplits(names) {
    if (names.length) {
      return this.redis.del(names.map(n => this.keys.buildSplitKey(n)));
    } else {
      return Promise.resolve(0);
    }
  }

  /**
   * Get split definition or null if it's not defined.
   */
  getSplit(splitName) {
    return this.redis.get(this.keys.buildSplitKey(splitName));
  }

  /**
   * Set till number.
   *
   * @TODO pending error handling
   */
  setChangeNumber(changeNumber) {
    return this.redis.set(this.keys.buildSplitsTillKey(), changeNumber + '').then(
      status => status === 'OK'
    );
  }

  /**
   * Get till number or null if it's not defined.
   *
   * @TODO pending error handling
   */
  getChangeNumber() {
    return this.redis.get(this.keys.buildSplitsTillKey()).then(value => {
      const i = parseInt(value, 10);

      return Number.isNaN(i) ? -1 : i;
    });
  }

  /**
   * @TODO we need to benchmark which is the maximun number of commands we could
   *       pipeline without kill redis performance.
   */
  getAll() {
    return this.redis.keys(this.keys.searchPatternForSplitKeys()).then(
      (listOfKeys) => this.redis.pipeline(listOfKeys.map(k => ['get', k])).exec()
    ).then(processPipelineAnswer);
  }

  getKeys() {
    return this.redis.keys(this.keys.searchPatternForSplitKeys()).then(
      (listOfKeys) => listOfKeys.map(this.keys.extractKey)
    );
  }

  /**
   * Delete everything in the current database.
   *
   * @NOTE documentation says it never fails.
   */
  flush() {
    return this.redis.flushdb().then(status => status === 'OK');
  }
}

export default SplitCacheInRedis;