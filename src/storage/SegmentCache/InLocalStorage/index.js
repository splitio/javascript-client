// @flow

'use strict';

const log = require('../../../utils/logger')('splitio-storage:localstorage');

const DEFINED = '1';

class SegmentCacheInLocalStorage {
  keys: KeyBuilderForLocalStorage;

  constructor(keys: KeyBuilderForLocalStorage) {
    this.keys = keys;
  }

  addToSegment(segmentName: string/*, segmentKeys: Array<string>*/): boolean {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    try {
      localStorage.setItem(segmentKey, DEFINED);
      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  }

  removeFromSegment(segmentName: string/*, segmentKeys: Array<string>*/): boolean {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    try {
      localStorage.removeItem(segmentKey);
      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  }

  resetSegments(segmentNames: Array<string>) {
    let isDiff = false;
    let index;

    // Scan current values from localStorage
    const storedSegmentNames = Object.keys(localStorage).reduce((accum, key) => {
      const segmentName = this.keys.extractSegmentName(key);

      if (segmentName) accum.push(segmentName);

      return accum;
    }, []);

    // Extreme fast => everything is empty
    if (segmentNames.length === 0 && storedSegmentNames.length === segmentNames.length)
      return isDiff;

    // Quick path
    if (storedSegmentNames.length !== segmentNames.length) {
      isDiff = true;

      storedSegmentNames.forEach(segmentName => this.removeFromSegment(segmentName));
      segmentNames.forEach(segmentName => this.addToSegment(segmentName));
    } else {
      // Slowest path => we need to find at least 1 difference because
      for(index = 0; index < segmentNames.length && storedSegmentNames.indexOf(segmentNames[index]) !== -1; index++) {}

      if (index < segmentNames.length) {
        isDiff = true;

        storedSegmentNames.forEach(segmentName => this.removeFromSegment(segmentName));
        segmentNames.forEach(segmentName => this.addToSegment(segmentName));
      }
    }

    return isDiff;
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
