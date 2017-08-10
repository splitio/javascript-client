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

const NodeStorageFactory = (settings) => {
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

        // When using REDIS we should:
        // 1- Disconnect from the storage
        // 2- Stop sending data to Redis and instance using empty in memory implementation
        destroy() {
          redis.disconnect();

          this.splits = new SplitCacheInMemory;
          this.segments = new SegmentCacheInMemory(keys);
          this.impressions = new ImpressionsCacheInMemory;
          this.metrics = new LatencyCacheInMemory;
          this.count = new CountCacheInMemory;
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
        count: new CountCacheInMemory,

        // When using MEMORY we should flush all the storages and leave them empty
        destroy() {
          this.splits.flush();
          this.segments.flush();
          this.impressions.clear();
          this.metrics.clear();
          this.count.clear();
        }
      };
  }

};

module.exports = NodeStorageFactory;
