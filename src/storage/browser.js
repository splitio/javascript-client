// @flow

'use strict';

const SplitCacheInMemory = require('./SplitCache/InMemory');
const SplitCacheInLocalStorage = require('./SplitCache/InLocalStorage');

const SegmentCacheInMemory = require('./SegmentCache/InMemory');
const SegmentCacheInLocalStorage = require('./SegmentCache/InLocalStorage');

const ImpressionsCacheInMemory = require('./ImpressionsCache/InMemory');
const MetricsCacheInMemory = require('./MetricsCache/InMemory');

/**
 * Browser storage instanciation which allows persistent strategy for segments
 * and splits.
 */
const BrowserStorageFactory = (storage: Object): SplitStorage => {

  switch (storage.type) {
    case 'MEMORY':
      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory,
        impressions: new ImpressionsCacheInMemory,
        metrics: new MetricsCacheInMemory
      };

    case 'LOCALSTORAGE':
      return {
        splits: new SplitCacheInLocalStorage,
        segments: new SegmentCacheInLocalStorage,
        impressions: new ImpressionsCacheInMemory,
        metrics: new MetricsCacheInMemory
      };

    default:
      throw new Error('Unsupported storage type');
  }

};

module.exports = BrowserStorageFactory;
