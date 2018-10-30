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
import findIndex from './findIndex';
import BaseMetricsAsyncCache from '../BaseMetricsAsyncCache';

class LatencyCacheInRedis extends BaseMetricsAsyncCache {
  constructor(keys, redis) {
    super();
    this.keys = keys;
    this.redis = redis;
  }

  track(metricName, latency) {
    const bucketNumber = findIndex(latency);

    return this.redis.incr(this.keys.buildLatencyKey(metricName, bucketNumber)).catch(() => {
      // noop, for telemetry metrics there's no need to throw.
    });
  }
}

export default LatencyCacheInRedis;
