"use strict";

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

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

var SegmentsStorage = function () {
  function SegmentsStorage() {
    (0, _classCallCheck3.default)(this, SegmentsStorage);

    this.storage = new _map2.default();
  }

  (0, _createClass3.default)(SegmentsStorage, [{
    key: "update",
    value: function update(name /*: string */, segment /*: Set */) /*: void */{
      this.storage.set(name, segment);
    }
  }, {
    key: "get",
    value: function get(name /*: string */) /*: Set */{
      return this.storage.get(name) || new _set2.default();
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.storage.toJSON();
    }
  }, {
    key: "segmentNames",
    value: function segmentNames() {
      return this.storage.keys();
    }
  }]);
  return SegmentsStorage;
}();

module.exports = SegmentsStorage;