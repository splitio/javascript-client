import { startsWith } from '../utils/lang';
import KeyBuilder from './Keys';
import { matching } from '../utils/key/factory';

class KeyBuilderForLocalStorage extends KeyBuilder {

  constructor(settings) {
    super(settings);
    this.regexSplitCacheKey = new RegExp(`^${this.settings.storage.prefix}\\.(splits?|trafficType)\\.`);
  }

  buildSegmentNameKey(segmentName) {
    return `${matching(this.settings.core.key)}.${this.settings.storage.prefix}.segment.${segmentName}`;
  }

  extractSegmentName(builtSegmentKeyName) {
    const prefix = `${matching(this.settings.core.key)}.${this.settings.storage.prefix}.segment.`;

    if (startsWith(builtSegmentKeyName, prefix))
      return builtSegmentKeyName.substr(prefix.length);
  }

  buildSplitsWithSegmentCountKey() {
    return `${this.settings.storage.prefix}.splits.usingSegments`;
  }

  buildLastUpdatedKey() {
    return `${this.settings.storage.prefix}.splits.lastUpdated`;
  }

  isSplitCacheKey(key) {
    return this.regexSplitCacheKey.test(key);
  }

  buildSplitsFilterQueryKey() {
    return `${this.settings.storage.prefix}.splits.filterQuery`;
  }
}

export default KeyBuilderForLocalStorage;
