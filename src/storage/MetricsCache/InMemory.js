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

const findIndex = require('./findIndex');

class MetricsCacheInMemory {
  counters: Array<number>;

  constructor() {
    this.clear();
  }

  /**
   * Recycle the collector (reset using 0 for all the counters)
   */
  clear() {
    this.counters = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    return this;
  }

  /**
   * Latency counters based on the internal ranges
   */
  state(): Array<number> {
    return this.counters;
  }

  /**
   * Store latency and return the number of occurrencies inside the range defined
   */
  track(latency: number): this {
    this.counters[findIndex(latency)]++;

    return this;
  }

  /**
   * Check if the is data changed from the defaults
   */
  isEmpty() {
    return this.counters.reduce((sum, e) => sum += e, 0) === 0;
  }

  /**
   * Hook JSON.stringify to expose the state of the counters
   */
  toJSON() {
    return this.counters;
  }
}

module.exports = MetricsCacheInMemory;
