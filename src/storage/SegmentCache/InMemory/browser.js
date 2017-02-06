// @flow

'use strict';

class SegmentCacheInMemory {
  segmentCache: Map<string, boolean>;
  keys: KeyBuilder;

  constructor(keys: KeyBuilder) {
    this.keys = keys;
    this.segmentCache = new Map();
  }

  addToSegment(segmentName: string/*, segmentKeys: Array<string>*/): boolean {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    this.segmentCache.set(segmentKey, true);

    return true;
  }

  removeFromSegment(segmentName: string/*, segmentKeys: Array<string>*/): boolean {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    this.segmentCache.delete(segmentKey);

    return true;
  }

  isInSegment(segmentName: string/*, key: string*/): boolean {
    const segmentKey: string = this.keys.buildSegmentNameKey(segmentName);

    return this.segmentCache.get(segmentKey) === true;
  }

  setChangeNumber(/*segmentName: string, changeNumber: number*/): boolean {
    return true;
  }

  getChangeNumber(/*segmentName: string*/): number {
    return -1;
  }

  registerSegment(/*segment: string*/): boolean {
    return false;
  }

  registerSegments(/*segments: Iterable<string>*/): boolean {
    return false;
  }

  getRegisteredSegments(): Iterable<string> {
    return [];
  }
}

module.exports = SegmentCacheInMemory;
