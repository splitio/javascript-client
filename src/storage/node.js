const Redis = require('ioredis');

const SplitCacheInMemory = require('./SplitCache/InMemory');
const SplitCacheInRedis = require('./SplitCache/InRedis');

const SegmentCacheInMemory = require('./SegmentCache/InMemory');
const SegmentCacheInRedis = require('./SegmentCache/InRedis');

const ImpressionsCacheInMemory = require('./ImpressionsCache/InMemory');
const ImpressionsCacheInRedis = require('./ImpressionsCache/InRedis');

const MetricsCacheInMemory = require('./MetricsCache/InMemory');
const MetricsCacheInRedis = require('./MetricsCache/InRedis');

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
        metrics: new MetricsCacheInRedis(keys, redis),

        // When using REDIS we should:
        // 1- Disconnect from the storage
        // 2- Stop sending data to Redis and instance using empty in memory implementation
        destroy() {
          redis.disconnect();

          this.splits = new SplitCacheInMemory;
          this.segments = new SegmentCacheInMemory(keys);
          this.impressions = new ImpressionsCacheInMemory;
          this.metrics = new MetricsCacheInMemory;
        }
      };
    }

    case 'MEMORY':
    default:
      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new MetricsCacheInMemory,

        // When using MEMORY we should flush all the storages and leave them empty
        destroy() {
          this.splits.flush();
          this.segments.flush();
          this.impressions.clear();
          this.metrics.clear();
        }
      };
  }

};

module.exports = NodeStorageFactory;
