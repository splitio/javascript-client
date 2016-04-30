"use strict";

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _map = require("babel-runtime/core-js/map");

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
function SplitsStorage() {
  this.storage = new _map2.default();
}

SplitsStorage.prototype.update = function (updates /*: Array<Split> */) /*: void */{
  var _this = this;

  updates.forEach(function (split) {
    if (!split.isGarbage()) {
      _this.storage.set(split.getKey(), split);
    } else {
      _this.storage.delete(split.getKey());
    }
  });
};

SplitsStorage.prototype.get = function (splitName /*: string */) /*:? Split */{
  return this.storage.get(splitName);
};

// @TODO optimize this query to be cached after each update
SplitsStorage.prototype.getSegments = function () /*: Set */{
  var mergedSegmentNames = new _set2.default();

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(this.storage.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var split = _step.value;

      mergedSegmentNames = new _set2.default([].concat((0, _toConsumableArray3.default)(mergedSegmentNames), (0, _toConsumableArray3.default)(split.getSegments())));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return mergedSegmentNames;
};

SplitsStorage.prototype.toJSON = function () /*: Map */{
  return this.storage;
};

module.exports = SplitsStorage;
//# sourceMappingURL=index.js.map