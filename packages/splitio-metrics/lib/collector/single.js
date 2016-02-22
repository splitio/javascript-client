/* @flow */'use strict';

function SingleCollector() {
  this.clear();
}

// counter based on the internal ranges
SingleCollector.prototype.state = function () /*: number */{
  return this.counter;
};

// increment counter
SingleCollector.prototype.track = function () /*: number */{
  return ++this.counter;
};

// recycle the collector (reset using 0)
SingleCollector.prototype.clear = function () /*: SingleCollector */{
  this.counter = 0;

  return this;
};

// hook JSON.stringify to expose the state of the counter
SingleCollector.prototype.toJSON = function () {
  return this.counter;
};

// Check if the is data changed from the defaults
SingleCollector.prototype.isEmpty = function () {
  return this.counter === 0;
};

module.exports = function SingleCollectorFactory() {
  return new SingleCollector();
};
//# sourceMappingURL=Single.js.map