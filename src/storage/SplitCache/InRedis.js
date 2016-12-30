// @flow

'use strict';

const keys = require('../Keys');

/**
 * Discard errors for an answer of multiple operations.
 */
const processPipelineAnswer = (results: Array<[any, string]>): Array<string> =>
  results.reduce((accum, [err, value]) => {
    if (err === null) accum.push(value);
    return accum;
  }, []);

class SplitCacheInRedis {
  redis: IORedis;

  constructor(redis: IORedis) {
    this.redis = redis;
  }

  addSplit(splitName: string, split: string): Promise<boolean> {
    return this.redis.set(keys.buildSplitKey(splitName), split).then(status => status === 'OK');
  }

  addSplits(splitNames: Array<string>, splits: Array<string>): Promise<Array<boolean>> {
    if (splitNames.length) {
      return this.redis.pipeline(splitNames.map(
        (value, index) => ['set', keys.buildSplitKey(value), splits[index]]
      ))
        .exec()
        .then(processPipelineAnswer)
        .then(answers => answers.map(status => status === 'OK'));
    } else {
      return Promise.resolve([true]);
    }
  }

  /**
   * Remove a given split from Redis. Returns the number of deleted keys.
   */
  removeSplit(splitName: string): Promise<number> {
    return this.redis.del(keys.buildSplitKey(splitName));
  }

  /**
   * Bulk delete of splits from Redis. Returns the number of deleted keys.
   */
  removeSplits(names: Array<string>): Promise<number> {
    if (names.length) {
      return this.redis.del(names.map(n => keys.buildSplitKey(n)));
    } else {
      return Promise.resolve(0);
    }
  }

  /**
   * Get split definition or null if it's not defined.
   */
  getSplit(splitName: string): Promise<?string> {
    return this.redis.get(keys.buildSplitKey(splitName));
  }

  /**
   * Set till number.
   *
   * @TODO pending error handling
   */
  setChangeNumber(changeNumber: number): Promise<boolean> {
    return this.redis.set(keys.buildSplitsTillKey(), changeNumber + '').then(
      status => status === 'OK'
    );
  }

  /**
   * Get till number or null if it's not defined.
   *
   * @TODO pending error handling
   */
  getChangeNumber(): Promise<number> {
    return this.redis.get(keys.buildSplitsTillKey()).then(value => {
      const i = parseInt(value, 10);

      return Number.isNaN(i) ? -1 : i;
    });
  }

  /**
   * @TODO we need to benchmark which is the maximun number of commands we could
   *       pipeline without kill redis performance.
   */
  getAll(): Promise<Array<string>> {
    return this.redis.keys(keys.searchPatternForSplitKeys()).then(
      (listOfKeys: Array<string>) => this.redis.pipeline(listOfKeys.map(k => ['get', k])).exec()
    ).then(processPipelineAnswer);
  }

  /**
   * Delete everything in the current database.
   *
   * @NOTE documentation says it never fails.
   */
  flush(): Promise<boolean> {
    return this.redis.flushdb().then(status => status === 'OK');
  }
}

module.exports = SplitCacheInRedis;
