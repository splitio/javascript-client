// @flow

'use strict';

const Redis = require('ioredis');

const SplitCacheInMemory = require('../SplitCache/InMemory');
const SplitCacheInRedis = require('../SplitCache/InRedis');

const SegmentCacheInMemory = require('../SegmentCache/InMemory');
const SegmentCacheInRedis = require('../SegmentCache/InRedis');

const NodeStorageFactory = (storage: Object): any => {

  switch (storage.type) {
    case 'MEMORY':
      return {
        splits: new SplitCacheInMemory,
        segments: new SegmentCacheInMemory
      };
    case 'REDIS': {
      const redis = new Redis(storage.options); // improve this

      return {
        splits: new SplitCacheInRedis(redis),
        segments: new SegmentCacheInRedis(redis)
      };
    }
    default:
      throw new Error('Unsupported storage type');
  }

};

module.exports = NodeStorageFactory;
