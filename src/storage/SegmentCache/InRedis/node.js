import { numberIsNaN } from '../../../utils/lang';

class SegmentCacheInRedis {

  constructor(keys, redis) {
    this.redis = redis;
    this.keys = keys;
  }

  addToSegment(segmentName, segmentKeys) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    if (segmentKeys.length) {
      return this.redis.sadd(segmentKey, segmentKeys).then(() => true);
    } else {
      return Promise.resolve(true);
    }
  }

  removeFromSegment(segmentName, segmentKeys) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    if (segmentKeys.length) {
      return this.redis.srem(segmentKey, segmentKeys).then(() => true);
    } else {
      return Promise.resolve(true);
    }
  }

  isInSegment(segmentName, key) {
    return this.redis.sismember(
      this.keys.buildSegmentNameKey(segmentName), key
    ).then(matches => matches !== 0);
  }

  setChangeNumber(segmentName, changeNumber) {
    return this.redis.set(
      this.keys.buildSegmentTillKey(segmentName), changeNumber + ''
    ).then(status => status === 'OK');
  }

  getChangeNumber(segmentName) {
    return this.redis.get(this.keys.buildSegmentTillKey(segmentName)).then(value => {
      const i = parseInt(value, 10);

      return numberIsNaN(i) ? -1 : i;
    });
  }

  registerSegment(segment) {
    return this.registerSegments(segment);
  }

  registerSegments(segments) {
    if (segments.length) {
      return this.redis.sadd(this.keys.buildRegisteredSegmentsKey(), segments).then(() => true);
    } else {
      return Promise.resolve(true);
    }
  }

  getRegisteredSegments() {
    return this.redis.smembers(this.keys.buildRegisteredSegmentsKey());
  }

  flush() {
    return this.redis.flushdb().then(status => status === 'OK');
  }
}

export default SegmentCacheInRedis;