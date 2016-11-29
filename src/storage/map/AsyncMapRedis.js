// @flow

'use strict';

const Redis = require('ioredis');

class AsyncMapRedis {
  redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  set(key : string, value : string) : Promise<boolean> {
    return this.redis.set(key, value).then(v => v === 'OK');
  }

  get(key : string) : Promise<?string> {
    return this.redis.get(key);
  }

  remove(key : string) : Promise<number> {
    return this.redis.del(key);
  }

  // pipeline(commands : Array<*>) : Promise<Array<*>> {
  //   return new Promise((resolve, reject) => {
  //     this.redis.pipeline(commands).exec((err, result) => {
  //       if (err) reject(err);
  //       resolve(result);
  //     });
  //   });
  // }

}

module.exports = AsyncMapRedis;
