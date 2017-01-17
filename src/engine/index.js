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

// @flow

'use strict';

const parser = require('./parser');
const LabelsConstants = require('../utils/labels');

function defaults(inst) {
  // in case we don't have a default treatment in the instanciation, use
  // 'control'
  if (typeof inst.baseInfo.defaultTreatment !== 'string') {
    inst.baseInfo.defaultTreatment = 'control';
  }
}

function Split(baseInfo: Object, evaluator: Function) {
  if (!(this instanceof Split)) {
    return new Split(baseInfo, evaluator);
  }

  this.baseInfo = baseInfo;
  this.evaluator = evaluator;

  defaults(this);
}

Split.parse = function parse(splitFlatStructure: SplitObject, storage: SplitStorage) {
  const { conditions, ...baseInfo } = splitFlatStructure;
  const evaluator = parser(conditions, storage);

  return new Split(baseInfo, evaluator);
};

Split.prototype.getKey = function getKey() {
  return this.baseInfo.name;
};

Split.prototype.getTreatment = async function getTreatment(key: SplitKey, attributes): Promise<Evaluation> {
  const {
    killed,
    seed,
    defaultTreatment
  } = this.baseInfo;

  let treatment;
  let label;

  if (this.isGarbage()) {
    treatment = 'control';
    label = LabelsConstants.SPLIT_ARCHIVED;
  } else if (killed) {
    treatment = defaultTreatment;
    label = LabelsConstants.SPLIT_KILLED;
  } else {
    const evaluation = await this.evaluator(key, seed, attributes);

    treatment = evaluation !== undefined ? evaluation.treatment : defaultTreatment;
    label = evaluation !== undefined ? evaluation.label : LabelsConstants.NO_CONDITION_MATCH;
  }

  return {
    treatment,
    label
  };
};

Split.prototype.isGarbage = function isGarbage() {
  return this.baseInfo.status === 'ARCHIVED';
};

Split.prototype.getChangeNumber = function getChangeNumber() {
  return this.baseInfo.changeNumber;
};

module.exports = Split;
