import resetSegments from '../resetSegments';

class SegmentCacheInMemory {

  constructor(keys) {
    this.keys = keys;
    this.flush();
  }

  flush() {
    this.segmentCache = {};
  }

  addToSegment(segmentName/*, segmentKeys: Array<string>*/) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    this.segmentCache[segmentKey] = true;

    return true;
  }

  removeFromSegment(segmentName/*, segmentKeys: Array<string>*/) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    delete this.segmentCache[segmentKey];

    return true;
  }

  isInSegment(segmentName/*, key: string*/) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    return this.segmentCache[segmentKey] === true;
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
    return Object.keys(this.segmentCache);
  }
}

SegmentCacheInMemory.prototype.resetSegments = resetSegments;

export default SegmentCacheInMemory;
