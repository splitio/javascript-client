// @flow

'use strict';

const keys = require('../../Keys');

class SegmentCacheInRedis {

  constructor(redis) {
    this.redis = redis;
  }

  addToSegment(segmentName : string, segmentKeys : Array<string>) : Promise<boolean> {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    return this.redis.sadd(segmentKey, segmentKeys).then(() => true);
  }

  removeFromSegment(segmentName : string, segmentKeys : Array<string>) : Promise<boolean> {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    return this.redis.srem(segmentKey, segmentKeys).then(() => true);
  }

  isInSegment(segmentName : string, key : string) : Promise<boolean> {
    return this.redis.sismember(
      keys.buildSegmentNameKey(segmentName), key
    ).then(matches => matches !== 0);
  }

  setChangeNumber(segmentName : string, changeNumber : number) : Promise<boolean> {
    return this.redis.set(
      keys.buildSegmentTillKey(segmentName), changeNumber + ''
    ).then(status => status === 'OK');
  }

  getChangeNumber(segmentName : string) : Promise<?number> {
    return this.redis.get(keys.buildSegmentTillKey(segmentName)).then(value => {
      const i = parseInt(value, 10);

      return Number.isNaN(i) ? null : i;
    });
  }

  flush() : Promise<boolean> {
    return this.redis.flushdb().then(status => status === 'OK');
  }

}

module.exports = SegmentCacheInRedis;
