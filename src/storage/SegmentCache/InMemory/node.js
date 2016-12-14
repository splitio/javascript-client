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

  addToSegment(segmentName : string, segmentKeys : Array<string>) : boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);
    const values = this.segmentCache.get(segmentKey);
    const keySet = values ? values : new Set();

    segmentKeys.forEach(k => keySet.add(k));

    this.segmentCache.set(segmentKey, keySet);

    return true;
  }

  removeFromSegment(segmentName : string, segmentKeys : Array<string>) : boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);
    const values = this.segmentCache.get(segmentKey);
    const keySet = values ? values : new Set();

    segmentKeys.forEach(k => keySet.delete(k));

    this.segmentCache.set(segmentKey, keySet);

    return true;
  }

  isInSegment(segmentName : string, key : string) : boolean {
    const segmentKey : string = keys.buildSegmentNameKey(segmentName);
    const segmentValues : ? Set<string> = this.segmentCache.get(segmentKey);

    if (segmentValues) {
      return segmentValues.has(key);
    }

    return false;
  }

  setChangeNumber(segmentName : string, changeNumber : number) : boolean {
    const segmentChangeNumberKey = keys.buildSegmentTillKey(segmentName);

    this.segmentChangeNumber.set(segmentChangeNumberKey, changeNumber);

    return true;
  }

  getChangeNumber(segmentName : string) : ?number {
    const segmentChangeNumberKey = keys.buildSegmentTillKey(segmentName);

    return this.segmentChangeNumber.get(segmentChangeNumberKey);
  }
}

module.exports = SegmentCacheInMemory;
