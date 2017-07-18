// @flow

'use strict';

const SplitCacheInMemory = require('./SplitCache/InMemory');
const SplitCacheInLocalStorage = require('./SplitCache/InLocalStorage');

const SegmentCacheInMemory = require('./SegmentCache/InMemory');
const SegmentCacheInLocalStorage = require('./SegmentCache/InLocalStorage');

const ImpressionsCacheInMemory = require('./ImpressionsCache/InMemory');
const LatencyCacheInMemory = require('./LatencyCache/InMemory');
const CountCacheInMemory = require('./CountCache/InMemory');

const KeyBuilder = require('./Keys');
const KeyBuilderLocalStorage = require('./KeysLocalStorage');

/**
 * Browser storage instanciation which allows persistent strategy for segments
 * and splits.
 */
const BrowserStorageFactory = (settings: Settings): SplitStorage => {
  const { storage } = settings;

  switch (storage.type) {
    case 'MEMORY': {
      const keys = new KeyBuilder(settings);

      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new LatencyCacheInMemory,
        count: new CountCacheInMemory,

        shared(settings: Settings) {
          return {
            splits: this.splits,
            segments: new SegmentCacheInMemory(new KeyBuilder(settings)),
            impressions: this.impressions,
            metrics: this.metrics,
            // @TODO review this because I'm not sure this will work with shared instances
            count: this.count
          };
        }
      };
    }

    case 'LOCALSTORAGE': {
      const keys = new KeyBuilderLocalStorage(settings);

      return {
        splits: new SplitCacheInLocalStorage(keys),
        segments: new SegmentCacheInLocalStorage(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new LatencyCacheInMemory,
        count: new CountCacheInMemory,

        shared(settings: Settings) {
          return {
            splits: this.splits,
            segments: new SegmentCacheInLocalStorage(new KeyBuilderLocalStorage(settings)),
            impressions: this.impressions,
            metrics: this.metrics,
            // @TODO review this because I'm not sure this will work with shared instances
            count: this.count
          };
        }
      };
    }

    default:
      throw new Error('Unsupported storage type');
  }

};

module.exports = BrowserStorageFactory;
