import SplitCacheInMemory from './SplitCache/InMemory';
import SplitCacheInLocalStorage from './SplitCache/InLocalStorage';
import SplitCacheInCloudflareKV from './SplitCache/InCloudflareKV';
import SegmentCacheInMemory from './SegmentCache/InMemory';
import SegmentCacheInLocalStorage from './SegmentCache/InLocalStorage';
import ImpressionsCacheInMemory from './ImpressionsCache/InMemory';
import LatencyCacheInMemory from './LatencyCache/InMemory';
import CountCacheInMemory from './CountCache/InMemory';
import EventsCacheInMemory from './EventsCache/InMemory';
import KeyBuilder from './Keys';
import KeyBuilderLocalStorage from './KeysLocalStorage';
import { STORAGE_MEMORY, STORAGE_LOCALSTORAGE, STORAGE_CLOUDFLARE_KV } from '../utils/constants';

const BrowserStorageFactory = context => {
  const settings = context.get(context.constants.SETTINGS);
  const { storage } = settings;

  console.log('Selected storage type', storage.type)
  switch (storage.type) {
    case STORAGE_CLOUDFLARE_KV: {
      const keys = new KeyBuilder(settings);

      return {
        splits: new SplitCacheInCloudflareKV(storage.options.binding),
        // TODO: Replace these in memory implementations with a KV implementation
        segments: new SegmentCacheInMemory(keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new LatencyCacheInMemory,
        count: new CountCacheInMemory,
        events: new EventsCacheInMemory(context),

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

      return {
        splits: new SplitCacheInLocalStorage(keys),
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
