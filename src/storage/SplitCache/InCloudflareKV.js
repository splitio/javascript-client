import logFactory from '../../utils/logger';

const log = logFactory('splitio-storage:cloudflarekv');

class SplitCacheInCloudflareKV {

  constructor(binding) {
    log['debug'](`Constructing SplitCacheInCloudflareKV`);
    this._client = binding;
  }

  // KV is eventually consistent therefore we can't safely add/remove specific splits
  // so let's not pretend we can
  addSplit(splitName, split) {
    log['debug'](`addSplit(${splitName}, ${split})`);
    throw new Error('Not implemented in Cloudflare KV - addSplit');
  }

  addSplits(entries) {
    log['debug'](`addSplits(${entries})`);
    throw new Error('Not implemented in Cloudflare KV - addSplits');
  }

  removeSplit(splitName) {
    log['debug'](`removeSplit(${splitName})`);
    throw new Error('Not implemented in Cloudflare KV - removeSplit');
  }

  removeSplits(splitNames) {
    log['debug'](`removeSplits(${splitNames})`);
    throw new Error('Not implemented in Cloudflare KV - removeSplits');
  }

  getSplit(splitName) {
    log['debug'](`getSplit(${splitName})`);
    return this._client.get(splitName);
  }

  setChangeNumber(changeNumber) {
    log['debug'](`setChangeNumber(${changeNumber})`);
    return true;
  }

  getChangeNumber() {
    log['debug'](`getChangeNumber()`);
    return -1;
  }

  getAll() {
    log['debug'](`getAll()`);
    return this._client.getAll();
  }

  getKeys() {
    log['debug'](`getKeys()`);
    return this._client.keys();
  }

  trafficTypeExists(trafficType) {
    log['debug'](`trafficTypeExists(${trafficType})`);
    return false;
  }

  usesSegments() {
    log['debug'](`usesSegments()`);
    return false;
  }

  flush() {
    log['debug'](`flush()`);
  }

  /**
   * Fetches multiple splits definitions.
   */
  fetchMany(splitNames) {
    log['debug'](`fetchMany(${splitNames})`);
    return this._client.getMany(splitNames);
  }

  /**
   * Check if the splits information is already stored in cache. In memory there is no cache to check.
   */
  checkCache() {
    log['debug'](`checkCache()`);
    return false;
  }
}

export default SplitCacheInCloudflareKV;
