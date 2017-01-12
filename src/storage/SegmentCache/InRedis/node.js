// @flow

'use strict';

const keys = require('../../Keys');

class SegmentCacheInRedis {
  redis: IORedis;

  constructor(redis: IORedis) {
    this.redis = redis;
  }

  addToSegment(segmentName: string, segmentKeys: Array<string>): Promise<boolean> {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    if (segmentKeys.length) {
      return this.redis.sadd(segmentKey, segmentKeys).then(() => true);
    } else {
      return Promise.resolve(true);
    }
  }

  removeFromSegment(segmentName: string, segmentKeys: Array<string>): Promise<boolean> {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    if (segmentKeys.length) {
      return this.redis.srem(segmentKey, segmentKeys).then(() => true);
    } else {
      return Promise.resolve(true);
    }
  }

  isInSegment(segmentName: string, key: string): Promise<boolean> {
    return this.redis.sismember(
      keys.buildSegmentNameKey(segmentName), key
    ).then(matches => matches !== 0);
  }

  setChangeNumber(segmentName: string, changeNumber: number): Promise<boolean> {
    return this.redis.set(
      keys.buildSegmentTillKey(segmentName), changeNumber + ''
    ).then(status => status === 'OK');
  }

  getChangeNumber(segmentName: string): Promise<number> {
    return this.redis.get(keys.buildSegmentTillKey(segmentName)).then(value => {
      const i = parseInt(value, 10);

      return Number.isNaN(i) ? -1 : i;
    });
  }

  registerSegment(segment: string): Promise<boolean> {
    return this.registerSegments(segment);
  }

  registerSegments(segments: Iterable<string>): Promise<boolean> {
    if (segments.length) {
      return this.redis.sadd(keys.buildRegisteredSegmentsKey(), segments).then(() => true);
    } else {
      return Promise.resolve(true);
    }
  }

  getRegisteredSegments(): Promise<Array<string>> {
    return this.redis.smembers(keys.buildRegisteredSegmentsKey());
  }

  flush(): Promise<boolean> {
    return this.redis.flushdb().then(status => status === 'OK');
  }
}

module.exports = SegmentCacheInRedis;
