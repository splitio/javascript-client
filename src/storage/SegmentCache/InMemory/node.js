import { numberIsInteger } from '../../../utils/lang';
import { _Set } from '../../../utils/lang/Sets';

class SegmentCacheInMemory {

  constructor(keys) {
    this.keys = keys;
    this.flush();
  }

  addToSegment(segmentName, segmentKeys) {
    const values = this.segmentCache[segmentName];
    const keySet = values ? values : new _Set();

    segmentKeys.forEach(k => keySet.add(k));

    this.segmentCache[segmentName] = keySet;

    return true;
  }

  removeFromSegment(segmentName, segmentKeys) {
    const values = this.segmentCache[segmentName];
    const keySet = values ? values : new _Set();

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
      this.segmentCache[segmentName] = new _Set();
    }

    return true;
  }

  registerSegments(segments) {
    for (let i = 0; i < segments.length; i++) {
      this.registerSegment(segments[i]);
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

    return numberIsInteger(value) ? value: -1;
  }

  flush() {
    this.segmentCache = {};
    this.segmentChangeNumber = {};
  }
}

export default SegmentCacheInMemory;