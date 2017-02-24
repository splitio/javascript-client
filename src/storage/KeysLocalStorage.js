// @flow

'use strict';

const KeyBuilder = require('./Keys');
const { matching } = require('../utils/key/factory');

class KeyBuilderForLocalStorage extends KeyBuilder {

  buildSegmentNameKey(segmentName: string) {
    return `${matching(this.settings.core.key)}.${this.settings.storage.prefix}.segment.${segmentName}`;
  }

}

module.exports = KeyBuilderForLocalStorage;
