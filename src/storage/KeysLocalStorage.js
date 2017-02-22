// @flow

'use strict';

const KeyBuilder = require('./Keys');

class KeyBuilderForLocalStorage extends KeyBuilder {

  buildSegmentNameKey(segmentName: string) {
    return `${this.settings.core.key.matchingKey}.${this.settings.storage.prefix}.segment.${segmentName}`;
  }

}

module.exports = KeyBuilderForLocalStorage;
