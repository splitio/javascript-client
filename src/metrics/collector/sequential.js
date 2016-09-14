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
'use strict';

function SequentialCollector() {
  this.queue = [];
}

// Get collected data
SequentialCollector.prototype.state = function () /*: array<any> */ {
  return this.queue;
};

// Store object in sequential order
SequentialCollector.prototype.track = function (data /*: any */) /*: any */ {
  return this.queue.push(data);
};

// Recycle the collector queue
SequentialCollector.prototype.clear = function () /*: SequentialCollector */ {
  this.queue.length = 0;

  return this;
};

// Hook JSON.stringify to expose the state of the counters
SequentialCollector.prototype.toJSON = function () {
  return this.queue;
};

// Check if the is data changed from the defaults
SequentialCollector.prototype.isEmpty = function () {
  return this.queue.length === 0;
};

module.exports = function SequentialCollectorFactory() {
  return new SequentialCollector();
};
