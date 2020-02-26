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
      this.splitCache.set(splitName, split);
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
    let results = [];

    for (const [key, value] of entries) {
      results.push(this.addSplit(key, value));
    }

    return results;
  }

  async removeSplit(splitName) {
    log['debug'](`removeSplit(${splitName})`);
    const split = await this.getSplit(splitName);
    if (split) {
      // Delete the Split
      this.splitCache.delete(splitName);

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
    return this.splitCache.get(splitName);
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
    return [...this.splitCache.values()];
  }

  async getKeys() {
    log['debug'](`getKeys()`);
    return [...this.splitCache.keys()];
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
    this.splitCache = new Map;
    this.ttCache = {};
    this.changeNumber = -1;
    this.splitsWithSegmentsCount = 0;
  }

  /**
   * Fetches multiple splits definitions.
   */
  async fetchMany(splitNames) {
    log['debug'](`fetchMany(${splitNames})`);
    const splits = new Map();
    splitNames.forEach(splitName => {
      splits.set(splitName, this.splitCache.get(splitName) || null);
    });
    return splits;
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
