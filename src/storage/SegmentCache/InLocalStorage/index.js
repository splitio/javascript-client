// @flow

'use strict';

const keys = require('../../Keys');

const DEFINED = '1';

class SegmentCacheInLocalStorage {

  addToSegment(segmentName: string, segmentKeys: Array<string>): boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    // try {
      localStorage.setItem(keys.buildSegmentNameKey(segmentName), DEFINED);
      return true;
    // } catch (e) {
    //   return false;
    // }
  }

  removeFromSegment(segmentName: string, segmentKeys: Array<string>): boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    // try {
      localStorage.removeItem(segmentKey);
      return true;
    // } catch (e) {
    //   return false;
    // }
  }

  isInSegment(segmentName: string, key: string): boolean {
    return localStorage.getItem(keys.buildSegmentNameKey(segmentName)) === DEFINED;
  }

  setChangeNumber(segmentName: string, changeNumber: number): boolean {
    return true;
  }

  getChangeNumber(segmentName: string): number {
    return -1;
  }

  registerSegment(segment: string): boolean {
    return false;
  }

  registerSegments(segments: Iterable<string>): boolean {
    return false;
  }

  getRegisteredSegments(): Iterable<string> {
    return [];
  }
}

module.exports = SegmentCacheInLocalStorage;
