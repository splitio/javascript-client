"use strict";

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

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

var SplitsStorage = function () {
  function SplitsStorage() {
    (0, _classCallCheck3.default)(this, SplitsStorage);

    this.storage = new _map2.default();
  }

  (0, _createClass3.default)(SplitsStorage, [{
    key: "update",
    value: function update(updates /*: Array<Split> */) /*: void */{
      // I'm not deleting splits because we should continue updating segments
      // doesn't matter if:
      // 1- no more splits reference to the segment
      // 2- the user delete the segment on the server
      //
      // Basically we are keeping garbage till we restart the SDK.
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(updates), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var split = _step.value;

          this.storage.set(split.getKey(), split);
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
    }
  }, {
    key: "get",
    value: function get(splitKey /*: string */) /*:? Split */{
      return this.storage.get(splitKey);
    }
  }, {
    key: "getSegments",
    value: function getSegments() /*: Set */{
      var mergedSegmentNames = new _set2.default();

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(this.storage.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var split = _step2.value;

          mergedSegmentNames = new _set2.default([].concat((0, _toConsumableArray3.default)(mergedSegmentNames), (0, _toConsumableArray3.default)(split.getSegments())));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return mergedSegmentNames;
    }
  }, {
    key: "toJSON",
    value: function toJSON() /*: string */{
      return this.storage.toJSON();
    }
  }]);
  return SplitsStorage;
}();

module.exports = SplitsStorage;