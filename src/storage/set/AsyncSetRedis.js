// @flow

'use strict';

const Redis = require('ioredis');

/**
 * 1- It's required Redis v2.4+ to used some features as multiple values
 *    addition / removal.
 */
class AsyncSetRedis {
  redis: Redis;
  key: string;

  constructor(redis : Redis, key : string) {
    this.redis = redis;
    this.key = key;
  }

  add(values : Array<string>) : Promise<number> {
    return this.redis.sadd(this.key, values);
  }

  remove(values : Array<string>) : Promise<number> {
    return this.redis.srem(this.key, values);
  }

  has(values : Array<string>) : Promise<Array<boolean>> {
    return this.redis.pipeline(
      values.map(v => ['sismember' , this.key, v])
    )
    .exec()
    .then(results => results.map(
      ([error, has]) => has === 1
    ));
  }
}

module.exports = AsyncSetRedis;
