// @flow

'use strict';

const keys = require('../../Keys');

class SegmentCacheInMemory {
  segmentCache: Map<string, Set<string>>;
  segmentChangeNumber: Map<string, number>;

  constructor() {
    this.segmentCache = new Map();
    this.segmentChangeNumber = new Map();
  }

  addToSegment(segmentName: string, segmentKeys: Array<string>): boolean {
    const values = this.segmentCache.get(segmentName);
    const keySet = values ? values: new Set();

    segmentKeys.forEach(k => keySet.add(k));

    this.segmentCache.set(segmentName, keySet);

    return true;
  }

  removeFromSegment(segmentName: string, segmentKeys: Array<string>): boolean {
    const values = this.segmentCache.get(segmentName);
    const keySet = values ? values: new Set();

    segmentKeys.forEach(k => keySet.delete(k));

    this.segmentCache.set(segmentName, keySet);

    return true;
  }

  isInSegment(segmentName: string, key: string): boolean {
    const segmentValues: ?Set<string> = this.segmentCache.get(segmentName);

    if (segmentValues) {
      return segmentValues.has(key);
    }

    return false;
  }

  registerSegment(segmentName: string): boolean {
    if (!this.segmentCache.has(segmentName)) {
      this.segmentCache.set(segmentName, new Set);
    }

    return true;
  }

  registerSegments(segments: Iterable<string>): boolean {
    for (let segmentName of segments) {
      this.registerSegment(segmentName);
    }

    return true;
  }

  getRegisteredSegments(): Iterable<string> {
    return this.segmentCache.keys();
  }

  setChangeNumber(segmentName: string, changeNumber: number): boolean {
    const segmentChangeNumberKey = keys.buildSegmentTillKey(segmentName);

    this.segmentChangeNumber.set(segmentChangeNumberKey, changeNumber);

    return true;
  }

  getChangeNumber(segmentName: string): number {
    const segmentChangeNumberKey = keys.buildSegmentTillKey(segmentName);
    const value = this.segmentChangeNumber.get(segmentChangeNumberKey);

    return Number.isInteger(value) ? value: -1;
  }
}

module.exports = SegmentCacheInMemory;
