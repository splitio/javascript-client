'use strict';

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

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

var parser = require('./parser');

function defaults(inst) {
  // in case we don't have a default treatment in the instanciation, use
  // 'control'
  if (typeof inst.baseInfo.defaultTreatment !== 'string') {
    inst.baseInfo.defaultTreatment = 'control';
  }
}

function Split(baseInfo, evaluator, segments) {
  if (!(this instanceof Split)) {
    return new Split(baseInfo, evaluator, segments);
  }

  this.baseInfo = baseInfo;
  this.evaluator = evaluator;
  this.segments = segments;

  defaults(this);
}

Split.parse = function parse(splitFlatStructure, storage) {
  var conditions = splitFlatStructure.conditions;
  var baseInfo = (0, _objectWithoutProperties3.default)(splitFlatStructure, ['conditions']);

  var _parser = parser(conditions, storage);

  var evaluator = _parser.evaluator;
  var segments = _parser.segments;


  return new Split(baseInfo, evaluator, segments);
};

Split.prototype.getKey = function getKey() {
  return this.baseInfo.name;
};

Split.prototype.getSegments = function getSegments() {
  return this.segments;
};

Split.prototype.getTreatment = function getTreatment(key, attributes) {
  var _baseInfo = this.baseInfo;
  var killed = _baseInfo.killed;
  var seed = _baseInfo.seed;
  var defaultTreatment = _baseInfo.defaultTreatment;


  if (killed) {
    return defaultTreatment;
  } else {
    var treatment = this.evaluator(key, seed, attributes);

    return treatment !== undefined ? treatment : defaultTreatment;
  }
};

Split.prototype.isGarbage = function isGarbage() {
  return this.baseInfo.status === 'ARCHIVED';
};

module.exports = Split;
//# sourceMappingURL=index.js.map