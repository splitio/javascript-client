const SplitCacheInMemory = require('./SplitCache/InMemory');
const SplitCacheInLocalStorage = require('./SplitCache/InLocalStorage');

const SegmentCacheInMemory = require('./SegmentCache/InMemory');
const SegmentCacheInLocalStorage = require('./SegmentCache/InLocalStorage');

const ImpressionsCacheInMemory = require('./ImpressionsCache/InMemory');
const LatencyCacheInMemory = require('./LatencyCache/InMemory');
const CountCacheInMemory = require('./CountCache/InMemory');

const KeyBuilder = require('./Keys');
const KeyBuilderLocalStorage = require('./KeysLocalStorage');

const BrowserStorageFactory = (settings) => {
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

        // When using shared instanciation with MEMORY we reuse everything but segments (they are customer per key).
        shared(settings) {
          const childKeyBuilder = new KeyBuilder(settings);

          return {
            splits: this.splits,
            segments: new SegmentCacheInMemory(childKeyBuilder),
            impressions: this.impressions,
            metrics: this.metrics,
            // @TODO review this because I'm not sure this will work with shared instances
            count: this.count,

            destroy() {
              this.splits = new SplitCacheInMemory;
              this.segments.flush();
            }
          };
        },

        destroy() {
          this.splits.flush();
          this.segments.flush();
          this.impressions.clear();
          this.metrics.clear();
          this.count.clear();
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

        // When using shared instanciation with MEMORY we reuse everything but segments (they are customer per key).
        shared(settings) {
          const childKeysBuilder = new KeyBuilderLocalStorage(settings);

          return {
            splits: this.splits,
            segments: new SegmentCacheInLocalStorage(childKeysBuilder),
            impressions: this.impressions,
            metrics: this.metrics,
            // @TODO review this because I'm not sure this will work with shared instances
            count: this.count,

            destroy() {
              this.splits = new SplitCacheInMemory;
              this.segments = new SegmentCacheInMemory(childKeysBuilder);
            }
          };
        },

        destroy() {
          this.splits = new SplitCacheInMemory;
          this.segments = new SegmentCacheInMemory(new KeyBuilder(settings));
          this.impressions.clear();
          this.metrics.clear();
          this.count.clear();
        }
      };
    }

    default:
      throw new Error('Unsupported storage type');
  }

};

module.exports = BrowserStorageFactory;
