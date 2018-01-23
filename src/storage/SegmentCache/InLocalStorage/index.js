'use strict';

const log = require('../../../utils/logger')('splitio-storage:localstorage');

const DEFINED = '1';

class SegmentCacheInLocalStorage {

  constructor(keys) {
    this.keys = keys;
  }

  addToSegment(segmentName/*, segmentKeys: Array<string>*/) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    try {
      localStorage.setItem(segmentKey, DEFINED);
      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  }

  removeFromSegment(segmentName/*, segmentKeys: Array<string>*/) {
    const segmentKey = this.keys.buildSegmentNameKey(segmentName);

    try {
      localStorage.removeItem(segmentKey);
      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  }

  resetSegments(segmentNames) {
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

  isInSegment(segmentName/*, key: string*/) {
    return localStorage.getItem(this.keys.buildSegmentNameKey(segmentName)) === DEFINED;
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

  flush() {
    log.info('Flushing localStorage');
    localStorage.clear();
  }
}

module.exports = SegmentCacheInLocalStorage;
