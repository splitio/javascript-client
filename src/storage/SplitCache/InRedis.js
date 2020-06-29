import { numberIsFinite, numberIsNaN } from '../../utils/lang';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-storage:redis');

/**
 * Discard errors for an answer of multiple operations.
 */
const processPipelineAnswer = (results) =>
  results.reduce((accum, errValuePair) => {
    if (errValuePair[0] === null) accum.push(errValuePair[1]);
    return accum;
  }, []);

class SplitCacheInRedis {

  constructor(keys, redis) {
    this.redis = redis;
    this.keys = keys;
    this.redisError = false;

    this.redis.on('error', (e) => {
      this.redisError = e;
    });

    this.redis.on('connect', () => {
      this.redisError = false;
    });
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
      const cmds = entries.map(keyValuePair => ['set', this.keys.buildSplitKey(keyValuePair[0]), keyValuePair[1]]);

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
    if (this.redisError) {
      log.error(this.redisError);

      throw this.redisError;
    }

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

      return numberIsNaN(i) ? -1 : i;
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

  trafficTypeExists(trafficType) {
    // If there is a number there should be > 0, otherwise the TT is considered as not existent.
    return this.redis.get(this.keys.buildTrafficTypeKey(trafficType))
      .then(ttCount => {
        ttCount = parseInt(ttCount, 10);
        if (!numberIsFinite(ttCount) || ttCount < 0) {
          log.info(`Could not validate traffic type existance of ${trafficType} due to data corruption of some sorts.`);
          return false;
        }

        return ttCount > 0;
      })
      .catch(e => {
        log.error(`Could not validate traffic type existance of ${trafficType} due to an error: ${e}.`);
        // If there is an error, bypass the validation so the event can get tracked.
        return true;
      });
  }

  // noop, just keeping the interface. This is used by client-side implementations only.
  usesSegments() {
    return true;
  }

  /**
   * Delete everything in the current database.
   *
   * @NOTE documentation says it never fails.
   */
  flush() {
    return this.redis.flushdb().then(status => status === 'OK');
  }

  /**
   * Fetches multiple splits definitions.
   */
  fetchMany(splitNames) {
    if (this.redisError) {
      log.error(this.redisError);

      throw this.redisError;
    }
    const splits = {};
    const keys = splitNames.map(splitName => this.keys.buildSplitKey(splitName));
    return this.redis.mget(...keys)
      .then(splitDefinitions => {
        splitNames.forEach((splitName, idx) => {
          splits[splitName] = splitDefinitions[idx];
        });
        return Promise.resolve(splits);
      })
      .catch(e => {
        log.error(`Could not grab splits due to an error: ${e}.`);
        return Promise.reject(e);
      });
  }

  /**
   * Check if the splits information is already stored in cache. Redis would actually be the cache.
   */
  checkCache() {
    return false;
  }
}

export default SplitCacheInRedis;
