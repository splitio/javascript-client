import ioredis from 'ioredis';
import RedisAdapter from '../../storage/RedisAdapter';
import { parseRedisOptions } from '../../utils/settings/storage/node';

/**
 * Wrapper for the Ioredis client.
 * Operations fail until `connect` is resolved when the Redis 'ready' event is emitted.
 *
 * @param {Object} redisOptions redis options with the format expected at `settings.storage.options`
 * @returns {import("@splitsoftware/splitio-commons/types/storages/types").IPluggableStorageWrapper} wrapper for IORedis client
 */
export function ioredisWrapper(redisOptions) {

  const options = RedisAdapter._defineOptions(parseRedisOptions(redisOptions));

  /** @type ioredis.Redis */
  const redis = new ioredis(...RedisAdapter._defineLibrarySettings(options));

  let isConnected = false;
  redis.on('ready', () => { isConnected = true; });
  // There is no need to listen for redis 'error' event, because in that case ioredis calls will be rejected.
  // It is done to avoid getting the message `Unhandled error event: Error: connect ECONNREFUSED`.
  // Also, we cannot reject the connect promise on an error, because the SDK will not get ready if the connection is established after the error.
  redis.on('error', () => { });

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
    incr(key, increment = 1) {
      return redis.incrby(key, increment);
    },
    decr(key, decrement = 1) {
      return redis.decrby(key, decrement);
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
      return new Promise((res) => {
        if (isConnected) res();
        else redis.on('ready', res);
      });
    },
    disconnect() {
      return Promise.resolve(redis && redis.disconnect());
    }
  };
}
