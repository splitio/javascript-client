// @flow

'use strict';

const SplitCacheInMemory = require('./SplitCache/InMemory');
const SplitCacheInLocalStorage = require('./SplitCache/InLocalStorage');

const SegmentCacheInMemory = require('./SegmentCache/InMemory');
const SegmentCacheInLocalStorage = require('./SegmentCache/InLocalStorage');

const ImpressionsCacheInMemory = require('./ImpressionsCache/InMemory');
const MetricsCacheInMemory = require('./MetricsCache/InMemory');

const KeyBuilder = require('./Keys');

/**
 * Browser storage instanciation which allows persistent strategy for segments
 * and splits.
 */
const BrowserStorageFactory = (settings: Settings): SplitStorage => {
  const { storage } = settings;
  const { prefix } = storage;
  const keys = new KeyBuilder(settings);

  switch (storage.type) {
    case 'MEMORY':
      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new MetricsCacheInMemory,

        shared(settings: Settings) {
          return {
            splits: this.splits,
            segments: new SegmentCacheInMemory(new KeyBuilder(settings)), // @TODO complete this
            impressions: this.impressions,
            metrics: this.metrics
          };
        }
      };

    case 'LOCALSTORAGE':
      return {
        splits: new SplitCacheInLocalStorage(keys),
        segments: new SegmentCacheInLocalStorage(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new MetricsCacheInMemory
      };

    default:
      throw new Error('Unsupported storage type');
  }

};

module.exports = BrowserStorageFactory;
