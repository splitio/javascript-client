import { startsWith } from '../utils/lang';
import KeyBuilder from './Keys';
import { matching } from '../utils/key/factory';

class KeyBuilderForLocalStorage extends KeyBuilder {

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

  buildLastCreatedKey() {
    return `${this.settings.storage.prefix}.splits.lastCreated`;
  }
}

export default KeyBuilderForLocalStorage;
