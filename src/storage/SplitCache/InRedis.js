// @flow

'use strict';

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
  keys: KeyBuilder;

  constructor(keys: KeyBuilder, redis: IORedis) {
    this.redis = redis;
    this.keys = keys;
  }

  addSplit(splitName: string, split: string): Promise<boolean> {
    return this.redis.set(
        this.keys.buildSplitKey(splitName), split
      ).then(
        status => status === 'OK'
      );
  }

  addSplits(entries: Array<[string, string]>): Promise<Array<boolean>> {
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
  removeSplit(splitName: string): Promise<number> {
    return this.redis.del(this.keys.buildSplitKey(splitName));
  }

  /**
   * Bulk delete of splits from Redis. Returns the number of deleted keys.
   */
  removeSplits(names: Array<string>): Promise<number> {
    if (names.length) {
      return this.redis.del(names.map(n => this.keys.buildSplitKey(n)));
    } else {
      return Promise.resolve(0);
    }
  }

  /**
   * Get split definition or null if it's not defined.
   */
  getSplit(splitName: string): Promise<?string> {
    return this.redis.get(this.keys.buildSplitKey(splitName));
  }

  /**
   * Set till number.
   *
   * @TODO pending error handling
   */
  setChangeNumber(changeNumber: number): Promise<boolean> {
    return this.redis.set(this.keys.buildSplitsTillKey(), changeNumber + '').then(
      status => status === 'OK'
    );
  }

  /**
   * Get till number or null if it's not defined.
   *
   * @TODO pending error handling
   */
  getChangeNumber(): Promise<number> {
    return this.redis.get(this.keys.buildSplitsTillKey()).then(value => {
      const i = parseInt(value, 10);

      return Number.isNaN(i) ? -1 : i;
    });
  }

  /**
   * @TODO we need to benchmark which is the maximun number of commands we could
   *       pipeline without kill redis performance.
   */
  getAll(): Promise<Array<string>> {
    return this.redis.keys(this.keys.searchPatternForSplitKeys()).then(
      (listOfKeys: Array<string>) => this.redis.pipeline(listOfKeys.map(k => ['get', k])).exec()
    ).then(processPipelineAnswer);
  }

  getKeys(): Promise<Array<string>> {
    throw Error('implement me');
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
