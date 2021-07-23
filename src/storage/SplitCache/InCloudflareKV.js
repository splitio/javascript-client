import logFactory from '../../utils/logger';
const log = logFactory('splitio-storage:cloudflarekv');

class SplitCacheInCloudflareKV {

  constructor(binding) {
    log['debug'](`Constructing SplitCacheInCloudflareKV with binding: ${JSON.stringify(binding)}`)
    // The KV binding that will be used to talk to CloudFlare KV
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

  async getSplit(splitName) {
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

  async getAll() {
    log['debug'](`getAll()`);
    const keys = await this.getKeys();
    return Promise.all(keys.map(key => this._client.get(key)));
  }

  async getKeys() {
    log['debug'](`getKeys()`);
    // TODO: Handle pagination
    const page = await this._client.list();
    return page.keys.map(result => result.name);
  }

  trafficTypeExists(trafficType) {
    log['debug'](`trafficTypeExists(${trafficType})`);
    return false;
  }

  async usesSegments() {
    log['debug'](`usesSegments()`);
    return false;
  }

  flush() {
    log['debug'](`flush()`);
  }

  /**
   * Fetches multiple splits definitions.
   */
  async fetchMany(splitNames) {
    log['debug'](`fetchMany(${splitNames})`);

    return new Map(
      await Promise.all(
        splitNames.map(
          async (splitName) => {
            const value = await this._client.get(splitName);
            return [splitName, value || null];
          }
        )
      )
    );
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
