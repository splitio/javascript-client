import logFactory from '../../../utils/logger';
const log = logFactory('splitio-storage:cloudflarekv:segments');

class SegmentCacheInCloudflareKV {

  constructor(binding) {
    log['debug'](`new SegmentCacheInCloudflareKV(${binding})`)
    this._client = binding;
  }

  async addToSegment(segmentName, segmentKeys) {
    log['debug'](`addToSegment(${segmentName}, ${JSON.stringify(segmentKeys)})`)
    return true
  }

  async removeFromSegment(segmentName, segmentKeys) {
    log['debug'](`removeFromSegment(${segmentName}, ${JSON.stringify(segmentKeys)})`)
    return true
  }

  async isInSegment(segmentName, key) {
    log['debug'](`isInSegment(${segmentName}, ${key})`)
    return false
  }

  async setChangeNumber(segmentName, changeNumber) {
    log['debug'](`setChangeNumber(${segmentName}, ${changeNumber})`)
    return true
  }

  async getChangeNumber(segmentName) {
    log['debug'](`getChangeNumber(${segmentName})`)
    return -1;
  }

  async registerSegment(segment) {
    log['debug'](`registerSegment(${segment})`)
    return this.registerSegments(segment);
  }

  async registerSegments(segments) {
    log['debug'](`registerSegments(${JSON.stringify(segments)})`)
    return true;
  }

  async getRegisteredSegments() {
    log['debug'](`getRegisteredSegments()`)
    return [] /* TODO: WTF is the shape of this object? */
  }

  async flush() {
    log['debug'](`flush()`)
    return true
  }
}

export default SegmentCacheInCloudflareKV;
