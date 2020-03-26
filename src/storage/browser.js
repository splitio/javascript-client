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
import { matching } from '../utils/key/factory';

const BrowserStorageFactory = context => {
  const settings = context.get(context.constants.SETTINGS);
  const { storage } = settings;

  const inMemoryInstances = {};
  const localStorageInstances = {};

  function getSegmentCacheInMemory(userKey, keys) {
    if (!inMemoryInstances[userKey]) {
      inMemoryInstances[userKey] = new SegmentCacheInMemory(keys);
      inMemoryInstances[userKey].count = 0;
    }
    inMemoryInstances[userKey].count++;
    return inMemoryInstances[userKey];
  }

  function getSegmentCacheInLocalStorage(userKey, keys) {
    if (!localStorageInstances[userKey])
      localStorageInstances[userKey] = new SegmentCacheInLocalStorage(keys);
    return localStorageInstances[userKey];
  }

  function flushSegmentCacheInMemory(userKey) {
    if (inMemoryInstances[userKey]) {
      inMemoryInstances[userKey].count--;
      if (inMemoryInstances[userKey].count === 0) {
        inMemoryInstances[userKey].flush();
        delete inMemoryInstances[userKey];
      }
    }
  }

  const mainUserKey = matching(settings.core.key);

  switch (storage.type) {
    case STORAGE_MEMORY: {
      const keys = new KeyBuilder(settings);

      return {
        splits: new SplitCacheInMemory,
        segments: getSegmentCacheInMemory(mainUserKey, keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new LatencyCacheInMemory,
        count: new CountCacheInMemory,
        events: new EventsCacheInMemory(context),

        // When using shared instanciation with MEMORY we reuse everything but segments (they are customer per key).
        shared(settings) {
          const childKeyBuilder = new KeyBuilder(settings);
          const userKey = matching(settings.core.key);

          return {
            splits: this.splits,
            segments: getSegmentCacheInMemory(userKey, childKeyBuilder),
            impressions: this.impressions,
            metrics: this.metrics,
            count: this.count,
            events: this.events,

            destroy() {
              this.splits = new SplitCacheInMemory;
              flushSegmentCacheInMemory(userKey);
            }
          };
        },

        destroy() {
          this.splits.flush();
          flushSegmentCacheInMemory(mainUserKey);
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
        segments: getSegmentCacheInLocalStorage(mainUserKey, keys),
        impressions: new ImpressionsCacheInMemory,
        metrics: new LatencyCacheInMemory,
        count: new CountCacheInMemory,
        events: new EventsCacheInMemory(context),

        // When using shared instanciation with MEMORY we reuse everything but segments (they are customer per key).
        shared(settings) {
          const childKeysBuilder = new KeyBuilderLocalStorage(settings);
          const userKey = matching(settings.core.key);

          return {
            splits: this.splits,
            segments: getSegmentCacheInLocalStorage(userKey, childKeysBuilder),
            impressions: this.impressions,
            metrics: this.metrics,
            count: this.count,
            events: this.events,

            destroy() {
              this.splits = new SplitCacheInMemory;
              this.segments = getSegmentCacheInMemory(userKey, childKeysBuilder);
            }
          };
        },

        destroy() {
          this.splits = new SplitCacheInMemory;
          this.segments = getSegmentCacheInMemory(mainUserKey, new KeyBuilder(settings));
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