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

  /**
   * Reset (update) the cached list of segments with the given list, removing and adding segments if necessary.
   * @NOTE based on the way we use segments in the browser, this way is the best option
   *
   * @param {string[]} segmentNames list of segment names
   * @returns boolean indicating if the cache was updated (i.e., given list was different from the cached one)
   */
  resetSegments(segmentNames) {
    let isDiff = false;
    let index;

    const storedSegmentKeys = Object.keys(this.segmentCache);

    // Extreme fast => everything is empty
    if (segmentNames.length === 0 && storedSegmentKeys.length === segmentNames.length)
      return isDiff;

    // Quick path
    if (storedSegmentKeys.length !== segmentNames.length) {
      isDiff = true;

      this.segmentCache = {};
      segmentNames.forEach (s => {
        this.addToSegment(s);
      });
    } else {
      // Slowest path => we need to find at least 1 difference because
      for(index = 0; index < segmentNames.length && this.isInSegment(segmentNames[index]); index++) {
        // TODO: why empty statement?
      }

      if (index < segmentNames.length) {
        isDiff = true;

        this.segmentCache = {};
        segmentNames.forEach (s => {
          this.addToSegment(s);
        });
      }
    }

    return isDiff;
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
    return [];
  }
}

export default SegmentCacheInMemory;
