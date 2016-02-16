'use strict';

var findIndex = require('../utils/binarySearch').bind(null, [1000, 1500, 2250, 3375, 5063, 7594, 11391, 17086, 25629, 38443, 57665, 86498, 129746, 194620, 291929, 437894, 656841, 985261, 1477892, 2216838, 3325257, 4987885, 7481828]);

function Collector() {
  this.clear();
}

Collector.prototype.counters = function (latency) {
  return this.counter;
};

Collector.prototype.track = function (latency) {
  return ++this.counter[findIndex(latency)];
};

Collector.prototype.clear = function () {
  return this.counter = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
};

module.exports = Collector;
//# sourceMappingURL=index.js.map