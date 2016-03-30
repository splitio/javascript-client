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

const parser = require('./parser');

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
  let {conditions, ...baseInfo} = splitFlatStructure;
  let {evaluator, segments} = parser(conditions, storage);

  return new Split(baseInfo, evaluator, segments);
};

Split.prototype.getKey = function getKey() {
  return this.baseInfo.name;
};

Split.prototype.getSegments = function getSegments() {
  return this.segments;
};

Split.prototype.getTreatment = function getTreatment(key, attributes) {
  let {
    killed,
    seed,
    defaultTreatment
  } = this.baseInfo;

  if (killed) {
    return defaultTreatment;
  } else {
    let treatment = this.evaluator(key, seed, attributes);

    return treatment !== undefined ? treatment : defaultTreatment;
  }
};

Split.prototype.isGarbage = function isGarbage() {
  return this.baseInfo.status === 'ARCHIVED';
};

module.exports = Split;
