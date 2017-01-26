// @flow

'use strict';

const Redis = require('ioredis');

const SplitCacheInMemory = require('./SplitCache/InMemory');
const SplitCacheInRedis = require('./SplitCache/InRedis');

const SegmentCacheInMemory = require('./SegmentCache/InMemory');
const SegmentCacheInRedis = require('./SegmentCache/InRedis');

const ImpressionsCacheInMemory = require('./ImpressionsCache/InMemory');
const ImpressionsCacheInRedis = require('./ImpressionsCache/InRedis');

const MetricsCacheInMemory = require('./MetricsCache/InMemory');
const MetricsCacheInRedis = require('./MetricsCache/InRedis');

const NodeStorageFactory = (settings: Settings): SplitStorage => {
  const { storage } = settings;

  switch (storage.type) {
    case 'REDIS': {
      const redis = new Redis(storage.options);

      return {
        splits: new SplitCacheInRedis(redis),
        segments: new SegmentCacheInRedis(redis),
        impressions: new ImpressionsCacheInRedis(settings, redis),
        metrics: new MetricsCacheInRedis(settings, redis)
      };
    }

    case 'MEMORY':
    default:
      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory,
        impressions: new ImpressionsCacheInMemory,
        metrics: new MetricsCacheInMemory
      };
  }

};

module.exports = NodeStorageFactory;
