import ioredis from 'ioredis';
import RedisAdapter from '../../storage/RedisAdapter';
import { parseRedisOptions } from '../../utils/settings/storage/node';

/**
 * Wrapper for the Ioredis client.
 * Operations fail until `connect` is resolved when the Redis 'ready' event is emitted.
 *
 * @param {Object} redisOptions redis options with the format expected at `settings.storage.options`
 * @returns {import("@splitsoftware/splitio-commons/types/storages/types").ICustomStorageWrapper} wrapper for IORedis client
 */
export function ioredisWrapper(redisOptions) {

  /** @type ioredis.Redis */
  let redis;

  return {
    get(key) {
      return redis.get(key);
    },
    set(key, value) {
      return redis.set(key, value).then(value => value === 'OK');
    },
    getAndSet(key, value) {
      const getResult = redis.get(key);
      return redis.set(key, value).then(() => getResult);
    },
    del(key) {
      return redis.del(key);
    },
    getKeysByPrefix(prefix) {
      return redis.keys(`${prefix}*`);
    },
    getMany(keys) {
      return redis.mget(...keys);
    },
    incr(key) {
      return redis.incr(key);
    },
    decr(key) {
      return redis.decr(key);
    },
    pushItems(key, items) {
      return redis.rpush(key, items);
    },
    popItems(key, count) {
      return redis.rpop(key, count);
    },
    getItemsCount(key) {
      return redis.llen(key);
    },
    itemContains(key, item) {
      return redis.sismember(key, item).then(matches => matches !== 0);
    },
    addItems(key, items) {
      return redis.sadd(key, items);
    },
    removeItems(key, items) {
      return redis.srem(key, items);
    },
    getItems(key) {
      return redis.smembers(key);
    },
    connect() {
      const options = RedisAdapter._defineOptions(parseRedisOptions(redisOptions));
      redis = new ioredis(...RedisAdapter._defineLibrarySettings(options));

      return new Promise((res) => {
        redis.on('ready', res);

        // There is no need to listen for redis 'error' event, because in that case ioredis calls will be rejected.
        // But it is done to avoid getting the ioredis message `Unhandled error event: Error: connect ECONNREFUSED`.
        // If we reject the promise, the SDK client will not get ready if the redis connection is established after an error.
        redis.on('error', () => { });
      });
    },
    close() {
      return Promise.resolve(redis && redis.disconnect()); // close the connection
    }
  };
}
