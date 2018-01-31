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

class CountCacheInRedis {
  constructor(keys, redis) {
    this.keys = keys;
    this.redis = redis;
  }

  scanKeys() {
    return this.redis.keys(this.keys.searchPatternForCountKeys());
  }

  track(metricName) {
    return this.redis.incr(this.keys.buildCountKey(metricName));
  }

  async clear() {
    const currentKeys = await this.scanKeys();

    if (currentKeys.length)
      return this.redis.del(currentKeys);

    return 0;
  }

  async state() {
    const results = {};

    const currentKeys = await this.scanKeys();
    const currentCounters = await this.redis.pipeline(currentKeys.map(k => ['get', k])).exec();

    let counters = currentCounters.map(([err, value]) => (err === null) ? parseInt(value, 10) : -1);

    for (const entryIndex in currentKeys) {
      const counterName = this.keys.extractCounterName(currentKeys[entryIndex]);
      const counter = counters[entryIndex];

      if (counter > 0) results[counterName] = counter;
    }

    return results;
  }

  isEmpty() {
    return this.scanKeys().then(els => els.length === 0);
  }
}

export default CountCacheInRedis;