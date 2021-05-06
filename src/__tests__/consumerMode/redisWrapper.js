import RedisAdapter from '../../storage/RedisAdapter';
import { parseRedisOptions } from '../../utils/settings/storage/node';

/**
 * Wrapper that uses our RedisAdapter
 *
 * @param {Object} redisAdapterOptions
 * @returns {import("../../../types/splitio").ICustomStorageWrapper} wrapper for IORedis client
 */
export function redisWrapper(redisAdapterOptions) {

  let redis;
  // eslint-disable-next-line no-unused-vars
  let redisError = false;

  return {
    get(key) {
      // if (redisError) return Promise.reject(redisError);
      return redis.get(key);
    },
    set(key, value) {
      // if (redisError) return Promise.reject(redisError);
      return redis.set(key, value).then(value => value === 'OK');
    },
    getAndSet(key, value) {
      // if (redisError) return Promise.reject(redisError);
      const getResult = redis.get(key);
      return redis.set(key, value).then(() => getResult);
    },
    del(key) {
      // if (redisError) return Promise.reject(redisError);
      return redis.del(key);
    },
    getKeysByPrefix(prefix) {
      // if (redisError) return Promise.reject(redisError);
      return redis.keys(`${prefix}*`);
    },
    getByPrefix(prefix) {
      // if (redisError) return Promise.reject(redisError);
      return this.getKeysByPrefix(prefix).then(keys => redis.mget(...keys));
    },
    incr(key) {
      // if (redisError) return Promise.reject(redisError);
      return redis.incr(key);
    },
    decr(key) {
      // if (redisError) return Promise.reject(redisError);
      return redis.decr(key);
    },
    getMany(keys) {
      // if (redisError) return Promise.reject(redisError);
      return redis.mget(...keys);
    },
    pushItems(key, items) {
      // if (redisError) return Promise.reject(redisError);
      return redis.rpush(key, items);
    },
    popItems(key, count) {
      // if (redisError) return Promise.reject(redisError);
      return redis.rpop(key, count);
    },
    getItemsCount(key) {
      // if (redisError) return Promise.reject(redisError);
      return redis.llen(key);
    },
    itemContains(key, item) {
      // if (redisError) return Promise.reject(redisError);
      return redis.sismember(key, item).then(matches => matches !== 0);
    },
    connect() {
      redis = new RedisAdapter(parseRedisOptions(redisAdapterOptions));

      // There is no need to listen for redis 'error' event, because in that case ioredis calls will be rejected and handled by the pluggable storage adapters.
      // But it is done to avoid getting the ioredis message `Unhandled error event: Error: connect ECONNREFUSED`.
      redis.on('error', (e) => {
        redisError = e;
      });

      return new Promise((res) => {
        redis.on('connect', () => {
          redisError = false;
          res(true);
        });
      });
    },
    close() {
      return Promise.resolve(redis && redis.disconnect()); // close the connection
    }
  };
}
