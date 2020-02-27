/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

import logFactory from '../../utils/logger';
const log = logFactory('splitio-storage:cloudflarekv:impressions');

const ONE_HOUR = 60 * 60

class ImpressionsCacheInCloudflareKV {
  // TODO: Pass in the key builder
  constructor(binding, keys) {
    this._client = binding;
    this._keys = keys;
  }

  /**
   * Store objects in sequential order
   * @param impressions {Array<{
   *  feature: string,
   *  keyName: string
   *  treatment: string
   *  time: string // eg. "1582819171342"
   *  label: string
   *  changeNumber: number
   * }>} an array of impressions to track
   */
  async track(impressions) {
    log['debug'](`track(${JSON.stringify(impressions)})`)
    // TODO: Run in parallel
    for (var i = 0; i < impressions.length; i++) {
      const impression = impressions[i];
      const key = this._keys.buildImpressionsKey(impression);
      // Give the producer 1 hour to pick this up and push to Split.io
      await this._client.put(key, JSON.stringify(impression), { expirationTtl: ONE_HOUR })
    }
    return true
  }

  /**
   * We are returning true because...
   * Not really sure why but the Redis implementation says to do so.
   * TODO: Lets try to understand what's going on here better.
   */
  isEmpty() {
    return true;
  }
}

export default ImpressionsCacheInCloudflareKV;
