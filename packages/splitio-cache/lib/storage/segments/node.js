'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = require('debug')('splitio-cache:segments');

function SegmentsStorage() {
  this.storage = new _map2.default();
}

// @TODO in a near future I need to support merging strategy
SegmentsStorage.prototype.update = function (name, segment) {
  log('Updating segment ' + name + ' with ' + segment.size + ' keys');

  this.storage.set(name, segment);
};

SegmentsStorage.prototype.get = function (name) {
  return this.storage.get(name) || new _set2.default();
};

SegmentsStorage.prototype.toJSON = function () {
  return this.storage;
};

module.exports = SegmentsStorage;
//# sourceMappingURL=node.js.map