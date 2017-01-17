// @flow

'use strict';

const Redis = require('ioredis');

const SplitCacheInMemory = require('./SplitCache/InMemory');
const SplitCacheInRedis = require('./SplitCache/InRedis');

const SegmentCacheInMemory = require('./SegmentCache/InMemory');
const SegmentCacheInRedis = require('./SegmentCache/InRedis');

const ImpressionsCacheInMemory = require('./ImpressionsCache/InMemory');
const MetricsCacheInMemory = require('./MetricsCache/InMemory');

const NodeStorageFactory = (storage: Object): SplitStorage => {

  switch (storage.type) {
    case 'REDIS': {
      const redis = new Redis(storage.options);

      return {
        splits: new SplitCacheInRedis(redis),
        segments: new SegmentCacheInRedis(redis),
        impressions: new ImpressionsCacheInMemory,
        metrics: new MetricsCacheInMemory
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
