import SplitCacheInMemory from './SplitCache/InMemory';
import SplitCacheInLocalStorage from './SplitCache/InLocalStorage';
import SegmentCacheInMemory from './SegmentCache/InMemory';
import SegmentCacheInLocalStorage from './SegmentCache/InLocalStorage';
import ImpressionsCacheInMemory from './ImpressionsCache/InMemory';
import LatencyCacheInMemory from './LatencyCache/InMemory';
import CountCacheInMemory from './CountCache/InMemory';
import EventsCacheInMemory from './EventsCache/InMemory';
import KeyBuilder from './Keys';
import KeyBuilderLocalStorage from './KeysLocalStorage';
import { STORAGE_MEMORY, STORAGE_LOCALSTORAGE } from '../utils/constants';

// This value might be eventually set via a config parameter
export const DEFAULT_CACHE_EXPIRATION_IN_MILLIS = 864000000; // 10 days

const BrowserStorageFactory = context => {
  const settings = context.get(context.constants.SETTINGS);
  const { storage } = settings;

  switch (storage.type) {
    case STORAGE_MEMORY: {
      const keys = new KeyBuilder(settings);

      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new LatencyCacheInMemory,
        count: new CountCacheInMemory,
        events: new EventsCacheInMemory(context),

        // When using shared instanciation with MEMORY we reuse everything but segments (they are customer per key).
        shared(settings) {
          const childKeyBuilder = new KeyBuilder(settings);

          return {
            splits: this.splits,
            segments: new SegmentCacheInMemory(childKeyBuilder),
            impressions: this.impressions,
            metrics: this.metrics,
            count: this.count,
            events: this.events,

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
          this.events.clear();
        }
      };
    }

    case STORAGE_LOCALSTORAGE: {
      const keys = new KeyBuilderLocalStorage(settings);
      const expirationTimestamp = Date.now() - DEFAULT_CACHE_EXPIRATION_IN_MILLIS;

      return {
        splits: new SplitCacheInLocalStorage(keys, expirationTimestamp, settings.sync.__splitFiltersValidation),
        segments: new SegmentCacheInLocalStorage(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new LatencyCacheInMemory,
        count: new CountCacheInMemory,
        events: new EventsCacheInMemory(context),

        // When using shared instanciation with MEMORY we reuse everything but segments (they are customer per key).
        shared(settings) {
          const childKeysBuilder = new KeyBuilderLocalStorage(settings);

          return {
            splits: this.splits,
            segments: new SegmentCacheInLocalStorage(childKeysBuilder),
            impressions: this.impressions,
            metrics: this.metrics,
            count: this.count,
            events: this.events,

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
          this.events.clear();
        }
      };
    }

    default:
      throw new Error('Unsupported storage type');
  }

};

export default BrowserStorageFactory;