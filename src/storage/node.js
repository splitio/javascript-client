const Redis = require('ioredis');

const SplitCacheInMemory = require('./SplitCache/InMemory');
const SplitCacheInRedis = require('./SplitCache/InRedis');

const SegmentCacheInMemory = require('./SegmentCache/InMemory');
const SegmentCacheInRedis = require('./SegmentCache/InRedis');

const ImpressionsCacheInMemory = require('./ImpressionsCache/InMemory');
const ImpressionsCacheInRedis = require('./ImpressionsCache/InRedis');

const LatencyCacheInMemory = require('./LatencyCache/InMemory');
const LatencyCacheInRedis = require('./LatencyCache/InRedis');

const CountCacheInMemory = require('./CountCache/InMemory');
const CountCacheInRedis = require('./CountCache/InRedis');

const KeyBuilder = require('./Keys');

const NodeStorageFactory = (settings: Settings): SplitStorage => {
  const { storage } = settings;
  const keys = new KeyBuilder(settings);

  switch (storage.type) {
    case 'REDIS': {
      const redis = new Redis(storage.options);

      return {
        splits: new SplitCacheInRedis(keys, redis),
        segments: new SegmentCacheInRedis(keys, redis),
        impressions: new ImpressionsCacheInRedis(keys, redis),
        metrics: new LatencyCacheInRedis(keys, redis),
        count: new CountCacheInRedis(keys, redis),
        destroy() {
          redis.disconnect();
        }
      };
    }

    case 'MEMORY':
    default:
      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new LatencyCacheInMemory,
        count: new CountCacheInMemory
      };
  }

};

module.exports = NodeStorageFactory;
