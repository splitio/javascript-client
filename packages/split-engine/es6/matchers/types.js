'use strict';

module.exports = {
  enum: {
    ALL: Symbol(),
    SEGMENT: Symbol(),
    WHITELIST: Symbol()
  },

  mapper(matcherType) {
    switch (matcherType) {
      case 'ALL_KEYS':
        return this.enum.ALL;
      case 'IN_SEGMENT':
        return this.enum.SEGMENT;
      case 'WHITELIST':
        return this.enum.WHITELIST;
      default:
        throw new Error('Invalid matcher type provided');
    }
  },

  chooser(type, segmentData, whitelistData) {
    if (type === this.enum.ALL) {
      return undefined;
    } else if (type === this.enum.SEGMENT) {
      return segmentData;
    } else if (type === this.enum.WHITELIST) {
      return whitelistData;
    } else {
      throw new Error(`Invalid type: ${type}`);
    }
  }
};
