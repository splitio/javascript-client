class SegmentCacheInMemory {

  constructor(keys) {
    this.keys = keys;
    this.flush();
  }

  addToSegment(segmentName, segmentKeys) {
    const values = this.segmentCache[segmentName];
    const keySet = values ? values : new Set();

    segmentKeys.forEach(k => keySet.add(k));

    this.segmentCache[segmentName] = keySet;

    return true;
  }

  removeFromSegment(segmentName, segmentKeys) {
    const values = this.segmentCache[segmentName];
    const keySet = values ? values : new Set();

    segmentKeys.forEach(k => keySet.delete(k));

    this.segmentCache[segmentName] = keySet;

    return true;
  }

  isInSegment(segmentName, key) {
    const segmentValues = this.segmentCache[segmentName];

    if (segmentValues) {
      return segmentValues.has(key);
    }

    return false;
  }

  registerSegment(segmentName) {
    if (!this.segmentCache[segmentName]) {
      this.segmentCache[segmentName] = new Set();
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
    return Object.keys(this.segmentCache);
  }

  setChangeNumber(segmentName, changeNumber) {
    const segmentChangeNumberKey = this.keys.buildSegmentTillKey(segmentName);

    this.segmentChangeNumber[segmentChangeNumberKey] = changeNumber;

    return true;
  }

  getChangeNumber(segmentName) {
    const segmentChangeNumberKey = this.keys.buildSegmentTillKey(segmentName);
    const value = this.segmentChangeNumber[segmentChangeNumberKey];

    return Number.isInteger(value) ? value : -1;
  }

  flush() {
    this.segmentCache = {};
    this.segmentChangeNumber = {};
  }
}

export default SegmentCacheInMemory;