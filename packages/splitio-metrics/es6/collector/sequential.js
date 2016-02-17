/* @flow */ 'use strict';

function SequentialCollector() {
  this.counter = [];
}

// Get latency sequence
SequentialCollector.prototype.counters = function () /*: Array<number> */ {
  return this.counter;
};

// Store latency in sequential order
SequentialCollector.prototype.track = function (latency /*: number */) /*: number */ {
  return this.counter.push(latency);
};

// Recycle the collector (reset using 0 for all the counters)
SequentialCollector.prototype.clear = function () /*: SequentialCollector */ {
  this.counter.length = 0;

  return this;
};

// Hook JSON.stringify to expose the state of the counters
SequentialCollector.prototype.toJSON = function () {
  return this.counter;
};

module.exports = function SequentialCollectorFactory() {
  return new SequentialCollector();
}
