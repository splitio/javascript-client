'use strict';

class SegmentCacheInMemory {

  constructor(keys) {
    this.keys = keys;
    this.flush();
  }

  addToSegment(segmentName, segmentKeys) {
    const values = this.segmentCache.get(segmentName);
    const keySet = values ? values: new Set();

    segmentKeys.forEach(k => keySet.add(k));

    this.segmentCache.set(segmentName, keySet);

    return true;
  }

  removeFromSegment(segmentName, segmentKeys) {
    const values = this.segmentCache.get(segmentName);
    const keySet = values ? values: new Set();

    segmentKeys.forEach(k => keySet.delete(k));

    this.segmentCache.set(segmentName, keySet);

    return true;
  }

  isInSegment(segmentName, key) {
    const segmentValues = this.segmentCache.get(segmentName);

    if (segmentValues) {
      return segmentValues.has(key);
    }

    return false;
  }

  registerSegment(segmentName) {
    if (!this.segmentCache.has(segmentName)) {
      this.segmentCache.set(segmentName, new Set);
    }

    return true;
  }

  registerSegments(segments) {
    for (let segmentName of segments) {
      this.registerSegment(segmentName);
    }

    return true;
  }

  getRegisteredSegments() {
    return this.segmentCache.keys();
  }

  setChangeNumber(segmentName, changeNumber) {
    const segmentChangeNumberKey = this.keys.buildSegmentTillKey(segmentName);

    this.segmentChangeNumber.set(segmentChangeNumberKey, changeNumber);

    return true;
  }

  getChangeNumber(segmentName) {
    const segmentChangeNumberKey = this.keys.buildSegmentTillKey(segmentName);
    const value = this.segmentChangeNumber.get(segmentChangeNumberKey);

    return Number.isInteger(value) ? value: -1;
  }

  flush() {
    this.segmentCache = new Map();
    this.segmentChangeNumber = new Map();
  }
}

export default SegmentCacheInMemory;