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
import LabelsConstants from '../../utils/labels';
import { get } from '../../utils/lang';
import { CONTROL } from '../../utils/constants';

function splitEvaluator(
  key,
  splitName,
  attributes,
  storage
) {
  let stringifiedSplit;

  try {
    stringifiedSplit = storage.splits.getSplit(splitName);
  } catch (e) {
    // the only scenario where getSplit can throw an error is when the storage
    // is redis and there is a connection issue and we can't retrieve the split
    // to be evaluated
    return Promise.resolve({
      treatment: CONTROL,
      label: LabelsConstants.EXCEPTION,
      config: null
    });
  }

  if (thenable(stringifiedSplit)) {
    return stringifiedSplit.then((result) => getEvaluation(
      result,
      key,
      attributes,
      storage
    ));
  }

  return getEvaluation(
    stringifiedSplit,
    key,
    attributes,
    storage
  );
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
    evaluation = split.getTreatment(key, attributes, splitEvaluator);

    // If the storage is async, evaluation and changeNumber will return a thenable
    if (thenable(evaluation)) {
      return evaluation.then(result => {
        result.changeNumber = split.getChangeNumber();
        result.config = get(splitJSON, `configurations.${result.treatment}`, null);

        return result;
      });
    } else {
      evaluation.changeNumber = split.getChangeNumber(); // Always sync and optional
      evaluation.config = get(splitJSON, `configurations.${evaluation.treatment}`, null);
    }
  }

  return evaluation;
}

export default splitEvaluator;
