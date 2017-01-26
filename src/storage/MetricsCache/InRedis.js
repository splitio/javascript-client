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

// @flow

'use strict';

const keys = require('../Keys');
const findIndex = require('./findIndex');

class MetricsCacheInRedis {
  settings: Settings;
  redis: IORedis;

  constructor(settings: Settings, redis: IORedis) {
    this.settings = settings;
    this.redis = redis;
  }

  scanKeys(): Promise<Array<string>> {
    return this.redis.keys(keys.searchPatternForLatency(this.settings.version, this.settings.runtime.ip));
  }

  track(latency: number, metricName: string = 'getTreatment'): Promise<number> {
    const bucketNumber = findIndex(latency);

    return this.redis.incr(
      keys.buildLatencyKey(this.settings.version, this.settings.runtime.ip, metricName, bucketNumber)
    );
  }

  async clear(): Promise<number> {
    const currentKeys = await this.scanKeys();

    if (currentKeys.length)
      return this.redis.del(currentKeys);

    return 0;
  }

  async state(): Promise<Array<number>> {
    const currentKeys = await this.scanKeys();
    const buckets = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    let counters = await this.redis.pipeline(currentKeys.map(k => ['get', k])).exec();

    counters = counters.map(([err, value]) => (err === null) ? parseInt(value, 10) : -1);

    for (const entryIndex in currentKeys) {
      const bucketNumber = keys.extractBucketNumber(currentKeys[entryIndex]);
      const counter = counters[entryIndex];

      if (counter > 0) buckets[bucketNumber] = counter;
    }

    return buckets;
  }

  isEmpty(): Promise<boolean> {
    return this.scanKeys().then(els => els.length === 0);
  }
}

module.exports = MetricsCacheInRedis;
