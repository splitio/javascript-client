// @flow

'use strict';

const SplitCacheInMemory = require('../SplitCache/InMemory');
const SplitCacheInLocalStorage = require('../SplitCache/InLocalStorage');

const SegmentCacheInMemory = require('../SegmentCache/InMemory');
const SegmentCacheInLocalStorage = require('../SegmentCache/InLocalStorage');

const BrowserStorageFactory = (storage: Object): any => {

  switch (storage.type) {
    case 'MEMORY':
      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory
      };
    case 'LOCALSTORAGE':
      return {
        splits: new SplitCacheInLocalStorage,
        segments: new SegmentCacheInLocalStorage
      };
    default:
      throw new Error('Unsupported storage type');
  }

};

module.exports = BrowserStorageFactory;
