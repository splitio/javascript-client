'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = require('debug')('splitio-cache:segments');

function SegmentsStorage() {
  this.storage = new _set2.default();
}

SegmentsStorage.prototype.update = function (segments) {
  log('Updating my segments list with [' + [].concat((0, _toConsumableArray3.default)(segments)) + ']');

  this.storage = segments;
};

SegmentsStorage.prototype.has = function (name) {
  return this.storage.has(name);
};

SegmentsStorage.prototype.toJSON = function () {
  return this.storage;
};

module.exports = SegmentsStorage;
//# sourceMappingURL=browser.js.map