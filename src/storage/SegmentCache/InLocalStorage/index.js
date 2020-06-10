import resetSegments from '../resetSegments';
import logFactory from '../../../utils/logger';
const log = logFactory('splitio-storage:localstorage');

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
    return Object.keys(localStorage).reduce((accum, key) => {
      const segmentName = this.keys.extractSegmentName(key);

      if (segmentName) accum.push(segmentName);

      return accum;
    }, []);
  }

  flush() {
    log.info('Flushing localStorage');
    localStorage.clear();
  }
}

SegmentCacheInLocalStorage.prototype.resetSegments = resetSegments;

export default SegmentCacheInLocalStorage;
