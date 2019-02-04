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
import { CONTROL } from '../../utils/constants';
import { isString } from '../../utils/lang';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-client');

function splitEvaluator(
  key,
  splitName,
  attributes,
  storage
) {
  let splitObject;
  let isSplitNameUnexistence = splitName === null || splitName === undefined;

  /**
   * If split name is null or undefined or is not a string return control and
   * label exception and log the error.
   */
  if (isSplitNameUnexistence || !isString(splitName)) {
    if (isSplitNameUnexistence) {
      log.error('getTreatment: split_name cannot be null');
    } else {
      log.error('getTreatment: split_name must be a string');
    }

    return {
      treatment: CONTROL,
      label: LabelsConstants.EXCEPTION
    };
  }

  try {
    splitObject = storage.splits.getSplit(splitName);
  } catch (e) {
    // the only scenario where getSplit can throw an error is when the storage
    // is redis and there is a connection issue and we can't retrieve the split
    // to be evaluated
    return Promise.resolve({
      treatment: CONTROL,
      label: LabelsConstants.EXCEPTION
    });
  }

  if (thenable(splitObject)) {
    return splitObject.then((result) => getEvaluation(
      result,
      key,
      attributes,
      storage
    ));
  }

  return getEvaluation(
    splitObject,
    key,
    attributes,
    storage
  );
}

function getEvaluation(
  splitObject,
  key,
  attributes,
  storage
) {
  let evaluation = {
    treatment: CONTROL,
    label: LabelsConstants.SPLIT_NOT_FOUND
  };

  if (splitObject) {
    const split = Engine.parse(JSON.parse(splitObject), storage);

    evaluation = split.getTreatment(key, attributes, splitEvaluator);

    // If the storage is async, evaluation and changeNumber will return a
    // thenable
    if (thenable(evaluation)) {
      return evaluation.then(result => {
        result.changeNumber = split.getChangeNumber();

        return result;
      });
    } else {
      evaluation.changeNumber = split.getChangeNumber(); // Always sync and optional
    }
  }

  return evaluation;
}

export default splitEvaluator;
