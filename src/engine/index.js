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

import objectAssign from 'object-assign';
import { get } from '../utils/lang';
import parser from './parser';
import keyParser from '../utils/key/parser';
import thenable from '../utils/promise/thenable';
import * as LabelsConstants from '../utils/labels';
import { CONTROL } from '../utils/constants';

function defaults(inst) {
  // in case we don't have a default treatment in the instanciation, use 'control'
  if (typeof inst.baseInfo.defaultTreatment !== 'string') {
    inst.baseInfo.defaultTreatment = CONTROL;
  }
}

function evaluationResult(result, defaultTreatment) {
  return {
    treatment: get(result, 'treatment', defaultTreatment),
    label: get(result, 'label', LabelsConstants.NO_CONDITION_MATCH)
  };
}

function Split(baseInfo, evaluator) {
  if (!(this instanceof Split)) {
    return new Split(baseInfo, evaluator);
  }

  this.baseInfo = baseInfo;
  this.evaluator = evaluator;

  defaults(this);
}

Split.parse = function parse(splitFlatStructure, storage) {
  const conditions = splitFlatStructure.conditions;
  const evaluator = parser(conditions, storage);

  return new Split(objectAssign({}, splitFlatStructure), evaluator);
};

Split.prototype.getKey = function getKey() {
  return this.baseInfo.name;
};

Split.prototype.getTreatment = function getTreatment(key, attributes, splitEvaluator) {
  const {
    killed,
    seed,
    defaultTreatment,
    trafficAllocation,
    trafficAllocationSeed,
    algo
  } = this.baseInfo;
  let parsedKey;
  let treatment;
  let label;

  try {
    parsedKey = keyParser(key);
  } catch (err) {
    return {
      treatment: CONTROL,
      label: LabelsConstants.EXCEPTION
    };
  }

  if (this.isGarbage()) {
    treatment = CONTROL;
    label = LabelsConstants.SPLIT_ARCHIVED;
  } else if (killed) {
    treatment = defaultTreatment;
    label = LabelsConstants.SPLIT_KILLED;
  } else {
    const evaluation = this.evaluator(
      parsedKey,
      seed,
      trafficAllocation,
      trafficAllocationSeed,
      attributes,
      algo,
      splitEvaluator
    );

    // Evaluation could be async, so we should handle that case checking for a
    // thenable object
    if (thenable(evaluation)) {
      return evaluation.then(result => evaluationResult(result, defaultTreatment));
    } else {
      return evaluationResult(evaluation, defaultTreatment);
    }
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

export default Split;
