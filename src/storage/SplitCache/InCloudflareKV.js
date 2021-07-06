import { isFinite } from '../../utils/lang';
import usesSegments from '../../utils/splits/usesSegments';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-storage:cloudflarekv');

// TODO: This is essentially just a copy of in memory
// we need to modify this to read / write to Cloudflare KV
class SplitCacheInCloudflareKV {

  constructor(binding) {
    log['debug'](`Constructing SplitCacheInCloudflareKV with binding: ${JSON.stringify(binding)}`)
    // The KV binding that will be used to talk to CloudFlare KV
    this._client = binding;
    this.flush();
  }

  async addSplit(splitName, split) {
    log['debug'](`addSplit(${splitName}, ${split})`);
    const splitFromMemory = await this.getSplit(splitName);
    if (splitFromMemory) { // We had this Split already
      const previousSplit = JSON.parse(splitFromMemory);

      if (previousSplit.trafficTypeName) {
        const previousTtName = previousSplit.trafficTypeName;
        this.ttCache[previousTtName]--;
        if (!this.ttCache[previousTtName]) delete this.ttCache[previousTtName];
      }

      if (usesSegments(previousSplit.conditions)) { // Substract from segments count for the previous version of this Split.
        this.splitsWithSegmentsCount--;
      }
    }

    const parsedSplit = JSON.parse(split);

    if (parsedSplit) {
      // Store the Split.
      await this._client.put(splitName, split);
      // Update TT cache
      const ttName = parsedSplit.trafficTypeName;
      if (ttName) { // safeguard
        if (!this.ttCache[ttName]) this.ttCache[ttName] = 0;
        this.ttCache[ttName]++;
      }

      // Add to segments count for the new version of the Split
      if (usesSegments(parsedSplit.conditions)) this.splitsWithSegmentsCount++;

      return true;
    } else {
      return false;
    }
  }

  async addSplits(entries) {
    log['debug'](`addSplits(${entries})`);
    let promises = [];

    for (const [key, value] of entries) {
      promises.push(this.addSplit(key, value));
    }

    return await Promise.all(promises);
  }

  async removeSplit(splitName) {
    log['debug'](`removeSplit(${splitName})`);
    const split = await this.getSplit(splitName);
    // TODO: Fetching the split is eventually consistent
    // We might get false positives here and re-delete keys
    // is that a problem?
    if (split) {
      // Delete the Split
      await this._client.delete(splitName);

      const parsedSplit = JSON.parse(split);
      const ttName = parsedSplit.trafficTypeName;

      if (ttName) { // safeguard
        this.ttCache[ttName]--; // Update tt cache
        if (!this.ttCache[ttName]) delete this.ttCache[ttName];
      }

      // Update the segments count.
      if (usesSegments(parsedSplit.conditions)) this.splitsWithSegmentsCount--;

      return 1;
    } else {
      return 0;
    }
  }

  async removeSplits(splitNames) {
    log['debug'](`removeSplits(${splitNames})`);
    splitNames.forEach(n => this.removeSplit(n));

    return splitNames.length;
  }

  async getSplit(splitName) {
    log['debug'](`getSplit(${splitName})`);
    return await this._client.get(splitName);
  }

  async setChangeNumber(changeNumber) {
    log['debug'](`setChangeNumber(${changeNumber})`);
    this.changeNumber = changeNumber;

    return true;
  }

  async getChangeNumber() {
    log['debug'](`getChangeNumber()`);
    return this.changeNumber;
  }

  async getAll() {
    log['debug'](`getAll()`);
    const keys = await this.getKeys();
    return await Promise.all(keys.map(key => this._client.get(key)))
  }

  async getKeys() {
    log['debug'](`getKeys()`);
    // TODO: Handle pagination
    const page = await this._client.list();
    return page.keys.map(result => result.name);
  }

  async trafficTypeExists(trafficType) {
    log['debug'](`trafficTypeExists(${trafficType})`);
    return isFinite(this.ttCache[trafficType]) && this.ttCache[trafficType] > 0;
  }

  async usesSegments() {
    log['debug'](`usesSegments()`);
    return this.getChangeNumber() === -1 || this.splitsWithSegmentsCount > 0;
  }

  async flush() {
    log['debug'](`flush()`);
    this.ttCache = {};
    this.changeNumber = -1;
    this.splitsWithSegmentsCount = 0;
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
  async checkCache() {
    log['debug'](`checkCache()`);
    return false;
  }
}

export default SplitCacheInCloudflareKV;
