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

import Engine from '../';
import thenable from '../../utils/promise/thenable';
import * as LabelsConstants from '../../utils/labels';
import { CONTROL } from '../../utils/constants';

const treatmentException = {
  treatment: CONTROL,
  label: LabelsConstants.EXCEPTION,
  config: null
};

function treatmentsException(splitNames) {
  const evaluations = {};
  splitNames.forEach(splitName => {
    evaluations[splitName] = treatmentException;
  });
  return evaluations;
}

export function evaluateFeature(
  key,
  splitName,
  attributes,
  storage
) {
  let stringifiedSplit;

  try {
    stringifiedSplit = storage.splits.getSplit(splitName);
  } catch (e) {
    // Exception on sync `getSplit` storage. ATM, it is not possible with InMemory and InLocal storages.
    return treatmentException;
  }

  if (thenable(stringifiedSplit)) {
    return stringifiedSplit.then((result) => getEvaluation(
      result,
      key,
      attributes,
      storage
    )).catch(
      // Exception on async `getSplit` storage. For example, when the storage is redis or
      // pluggable and there is a connection issue and we can't retrieve the split to be evaluated
      () => treatmentException
    );
  }

  return getEvaluation(
    stringifiedSplit,
    key,
    attributes,
    storage
  );
}

export function evaluateFeatures(
  key,
  splitNames,
  attributes,
  storage
) {
  let stringifiedSplits;

  try {
    stringifiedSplits = storage.splits.getSplits(splitNames);
  } catch (e) {
    // Exception on sync `getSplit` storage. ATM, it is not possible with InMemory and InLocal storages.
    return treatmentsException(splitNames);
  }

  return (thenable(stringifiedSplits)) ?
    stringifiedSplits.then(splits => getEvaluations(splitNames, splits, key, attributes, storage))
      .catch(() => {
        // Exception on async `getSplits` storage. For example, when the storage is redis or
        // pluggable and there is a connection issue and we can't retrieve the split to be evaluated
        return treatmentsException(splitNames);
      }) :
    getEvaluations(splitNames, stringifiedSplits, key, attributes, storage);
}

function getEvaluation(
  stringifiedSplit,
  key,
  attributes,
  storage
) {
  let evaluation = {
    treatment: CONTROL,
    label: LabelsConstants.SPLIT_NOT_FOUND,
    config: null
  };

  if (stringifiedSplit) {
    const splitJSON = JSON.parse(stringifiedSplit);
    const split = Engine.parse(splitJSON, storage);
    evaluation = split.getTreatment(key, attributes, evaluateFeature);

    // If the storage is async and the evaluated split uses segment, evaluation is thenable
    if (thenable(evaluation)) {
      return evaluation.then(result => {
        result.changeNumber = split.getChangeNumber();
        result.config = splitJSON.configurations && splitJSON.configurations[result.treatment] || null;

        return result;
      });
    } else {
      evaluation.changeNumber = split.getChangeNumber(); // Always sync and optional
      evaluation.config = splitJSON.configurations && splitJSON.configurations[evaluation.treatment] || null;
    }
  }

  return evaluation;
}

function getEvaluations(
  splitNames,
  splits,
  key,
  attributes,
  storage
) {
  const result = {};
  const thenables = [];
  splitNames.forEach(splitName => {
    const evaluation = getEvaluation(
      splits[splitName],
      key,
      attributes,
      storage
    );
    if (thenable(evaluation)) {
      thenables.push(evaluation.then(res => {
        result[splitName] = res;
      }));
    } else {
      result[splitName] = evaluation;
    }
  });

  return thenables.length > 0 ? Promise.all(thenables).then(() => result) : result;
}