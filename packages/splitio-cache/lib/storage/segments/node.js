'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

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