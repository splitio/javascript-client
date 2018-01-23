'use strict';

class SegmentCacheInMemory {

  constructor(keys) {
    this.keys = keys;
    this.flush();
  }

  flush() {
    this.segmentCache = new Map();
  }

  addToSegment(segmentName/*, segmentKeys: Array<string>*/) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    this.segmentCache.set(segmentKey, true);

    return true;
  }

  removeFromSegment(segmentName/*, segmentKeys: Array<string>*/) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    this.segmentCache.delete(segmentKey);

    return true;
  }

  // @NOTE based on the way we use segments in the browser, this way is the best
  //       option
  resetSegments(segmentNames) {
    let isDiff = false;
    let index;
    let s;

    // Extreme fast => everything is empty
    if (segmentNames.length === 0 && this.segmentCache.size === segmentNames.length)
      return isDiff;

    // Quick path
    if (this.segmentCache.size !== segmentNames.length) {
      isDiff = true;

      this.segmentCache = new Map();
      for (s of segmentNames) {
        this.addToSegment(s);
      }
    } else {
      // Slowest path => we need to find at least 1 difference because
      for(index = 0; index < segmentNames.length && this.isInSegment(segmentNames[index]); index++) {}

      if (index < segmentNames.length) {
        isDiff = true;

        this.segmentCache = new Map();
        for (s of segmentNames) {
          this.addToSegment(s);
        }
      }
    }

    return isDiff;
  }

  isInSegment(segmentName/*, key: string*/) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    return this.segmentCache.get(segmentKey) === true;
  }

  setChangeNumber(/*segmentName: string, changeNumber: number*/) {
    return true;
  }

  getChangeNumber(/*segmentName: string*/) {
    return -1;
  }

  registerSegment(/*segment: string*/) {
    return false;
  }

  registerSegments(/*segments: Iterable<string>*/) {
    return false;
  }

  getRegisteredSegments() {
    return [];
  }
}

module.exports = SegmentCacheInMemory;
