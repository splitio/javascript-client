// @flow

'use strict';

const keys = require('../../Keys');

const DEFINED = '1';

class SegmentCacheInLocalStorage {

  addToSegment(segmentName: string, segmentKeys: Array<string>): boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    try {
      localStorage.setItem(keys.buildSegmentNameKey(segmentName), DEFINED);
    } catch (e) {
      return false;
    }
  }

  removeFromSegment(segmentName: string, segmentKeys: Array<string>): boolean {
    const segmentKey = keys.buildSegmentNameKey(segmentName);

    try {
      localStorage.removeItem(segmentKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  isInSegment(segmentName: string, key: string): boolean {
    return localStorage.getItem(keys.buildSegmentNameKey(segmentName)) === DEFINED;
  }

  /**
   * TBD
   */
  setChangeNumber(segmentName: string, changeNumber: number): boolean {
    return true;
  }

  /**
   * TBD
   */
  getChangeNumber(segmentName: string): ?number {
    return -1;
  }
}

module.exports = SegmentCacheInLocalStorage;
