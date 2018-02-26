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

class LatencyCacheInMemory {
  constructor() {
    this.clear();
  }

  clear() {
    this.counters = {};

    return this;
  }

  state() {
    return this.counters;
  }

  track(metricName, latency) {
    // Initialize if needed
    if (this.counters[metricName] === undefined) {
      this.counters[metricName] = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ];
    }

    // +1 based on the latency number
    this.counters[metricName][findIndex(latency)]++;

    return this;
  }

  isEmpty() {
    return Object.keys(this.counters).length === 0;
  }

  toJSON() {
    return this.counters;
  }
}

export default LatencyCacheInMemory;