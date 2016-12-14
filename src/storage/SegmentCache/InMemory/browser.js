// @flow

'use strict';

const keys = require('../../Keys');

class SegmentCacheInMemory {
  segmentCache: Map<string, boolean>;
  segmentChangeNumber: Map<string, number>;

  constructor() {
    this.segmentCache = new Map();
    this.segmentChangeNumber = new Map();
  }

  /**
   * Define a Segment.
   */
  addToSegment(segmentName : string, segmentKeys : Array<string>) : boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    this.segmentCache.set(segmentKey, true);

    return true;
  }

  /**
   * Delete a Segment.
   */
  removeFromSegment(segmentName : string, segmentKeys : Array<string>) : boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    this.segmentCache.delete(segmentKey);

    return true;
  }

  /**
   * Is the segment defined?
   */
  isInSegment(segmentName : string, key : string) : boolean {
    const segmentKey : string = keys.buildSegmentNameKey(segmentName);

    return this.segmentCache.get(segmentKey) === true;
  }

  /**
   * TBD
   */
  setChangeNumber(segmentName : string, changeNumber : number) : boolean {
    return true;
  }

  /**
   * TBD
   */
  getChangeNumber(segmentName : string) : ?number {
    return -1;
  }
}

module.exports = SegmentCacheInMemory;
