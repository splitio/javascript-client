import logFactory from '../../../utils/logger';
const log = logFactory('splitio-storage:localstorage');

const DEFINED = '1';

class SegmentCacheInLocalStorage {

  constructor(keys) {
    this.keys = keys;
    // There is not need to flush segments cache like splits cache, since resetSegments receives the up-to-date list of active segments
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

  /**
   * Reset (update) the cached list of segments with the given list, removing and adding segments if necessary.
   *
   * @param {string[]} segmentNames list of segment names
   * @returns boolean indicating if the cache was updated (i.e., given list was different from the cached one)
   */
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
      for(index = 0; index < segmentNames.length && storedSegmentNames.indexOf(segmentNames[index]) !== -1; index++) {
        // TODO: why empty statement?
      }

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

  /**
   * Removes list of segments from localStorage
   * @NOTE this method is not being used at the moment
   */
  flush() {
    log.info('Flushing MySegments data from localStorage');

    // We cannot simply call `localStorage.clear()` since that implies removing user items from the storage
    // We could optimize next sentence, since it implies iterating over all localStorage items
    this.resetSegments([]);
  }
}

export default SegmentCacheInLocalStorage;
