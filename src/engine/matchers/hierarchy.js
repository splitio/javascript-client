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
'use strict';

const log = require('../../utils/logger')('splitio-engine:matcher');
const Engine = require('../');
const thenable = require('../../utils/promise/thenable');

function checkTreatment(evaluation, acceptableTreatments, parentName) {
  let matches = false;

  if (Array.isArray(acceptableTreatments)) {
    matches = acceptableTreatments.indexOf(evaluation.treatment) >= 0;
  }

  log.debug(`[hierarchicalMatcher] Parent split "${parentName}" evaluated to "${evaluation.treatment}" with label "${evaluation.label}". ${parentName} evaluated treatment is part of [${acceptableTreatments}] ? ${matches}.`);

  return matches;
}

function evaluateParent(splitObject, name, key, attributes, acceptableTreatments, storage) {
  const splitInstance = Engine.parse(JSON.parse(splitObject), storage);
  const evaluation = splitInstance.getTreatment(key, attributes);
  let matches = false;

  if (thenable(evaluation)) {
    matches = evaluation.then(resp => checkTreatment(resp, acceptableTreatments, name));
  } else {
    matches = checkTreatment(evaluation, acceptableTreatments, name);
  }

  return matches;
}

function hierarchicalMatcherContext({
  split,
  treatments
}, storage: SplitStorage) {

  return function hierarchicalMatcher({
    key,
    attributes
  }) {
    const splitObject = storage.splits.getSplit(split);

    if (splitObject) {
      log.debug(`[hierarchicalMatcher] will evaluate parent split: "${split}" with key: ${key} ${ attributes ? `\n attributes: ${JSON.stringify(attributes)}` : ''}`);

      if (thenable(splitObject)) {
        return splitObject.then((resp: string) => evaluateParent(resp, split, key, attributes, treatments, storage));
      } else {
        return evaluateParent(splitObject, split, key, attributes, treatments, storage);
      }
    } else {
      log.warn(`[hierarchicalMatcher] Parent split "${split}" does not exist. [hierarchicalMatcher] evaluates to false.`);
      return false;
    }
  };
}

module.exports = hierarchicalMatcherContext;
