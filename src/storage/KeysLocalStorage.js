// @flow

'use strict';

const startsWith = require('core-js/library/fn/string/starts-with');

const KeyBuilder = require('./Keys');
const { matching } = require('../utils/key/factory');

class KeyBuilderForLocalStorage extends KeyBuilder {

  buildSegmentNameKey(segmentName: string) {
    return `${matching(this.settings.core.key)}.${this.settings.storage.prefix}.segment.${segmentName}`;
  }

  extractSegmentName(builtSegmentKeyName: string): ?string {
    const prefix = `${matching(this.settings.core.key)}.${this.settings.storage.prefix}.segment.`;

    if (startsWith(builtSegmentKeyName, prefix))
      return builtSegmentKeyName.substr(prefix.length);
  }
}

module.exports = KeyBuilderForLocalStorage;
