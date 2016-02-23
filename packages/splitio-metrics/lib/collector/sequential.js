/* @flow */'use strict';

function SequentialCollector() {
  this.queue = [];
}

// Get collected data
SequentialCollector.prototype.state = function () /*: array<any> */{
  return this.queue;
};

// Store object in sequential order
SequentialCollector.prototype.track = function (data /*: any */) /*: any */{
  return this.queue.push(data);
};

// Recycle the collector queue
SequentialCollector.prototype.clear = function () /*: SequentialCollector */{
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
//# sourceMappingURL=Sequential.js.map