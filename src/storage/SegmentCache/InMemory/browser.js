// @flow

'use strict';

const keys = require('../../Keys');

class SegmentCacheInMemory {
  segmentCache: Map<string, boolean>;

  constructor() {
    this.segmentCache = new Map();
  }

  addToSegment(segmentName: string/*, segmentKeys: Array<string>*/): boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    this.segmentCache.set(segmentKey, true);

    return true;
  }

  removeFromSegment(segmentName: string/*, segmentKeys: Array<string>*/): boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    this.segmentCache.delete(segmentKey);

    return true;
  }

  isInSegment(segmentName: string/*, key: string*/): boolean {
    const segmentKey: string = keys.buildSegmentNameKey(segmentName);

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
