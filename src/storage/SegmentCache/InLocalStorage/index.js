// @flow

'use strict';

const log = require('debug')('splitio-storage:localstorage');

const DEFINED = '1';

class SegmentCacheInLocalStorage {
  keys: KeyBuilder;

  constructor(keys: KeyBuilder) {
    this.keys = keys;
  }

  addToSegment(segmentName: string/*, segmentKeys: Array<string>*/): boolean {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    try {
      localStorage.setItem(segmentKey, DEFINED);
      return true;
    } catch (e) {
      log(e);
      return false;
    }
  }

  removeFromSegment(segmentName: string/*, segmentKeys: Array<string>*/): boolean {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    try {
      localStorage.removeItem(segmentKey);
      return true;
    } catch (e) {
      log(e);
      return false;
    }
  }

  isInSegment(segmentName: string/*, key: string*/): boolean {
    return localStorage.getItem(this.keys.buildSegmentNameKey(segmentName)) === DEFINED;
  }

  setChangeNumber(/*segmentName: string, changeNumber: number*/): boolean {
    return true;
  }

  getChangeNumber(/*segmentName: string*/): number {
    return -1;
  }

  registerSegment(/*segment: string*/): boolean {
    return false;
  }

  registerSegments(/*segments: Iterable<string>*/): boolean {
    return false;
  }

  getRegisteredSegments(): Iterable<string> {
    return [];
  }

  flush() {
    localStorage.clear();
  }
}

module.exports = SegmentCacheInLocalStorage;
