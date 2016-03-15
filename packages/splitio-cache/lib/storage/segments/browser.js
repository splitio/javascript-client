'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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