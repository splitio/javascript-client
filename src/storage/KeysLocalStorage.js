import startsWith from 'core-js/library/fn/string/starts-with';
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
}

export default KeyBuilderForLocalStorage;