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
import logFactory from '../../utils/logger';
const log = logFactory('splitio-engine:matcher');
import thenable from '../../utils/promise/thenable';

function checkTreatment(evaluation, acceptableTreatments, parentName) {
  let matches = false;

  if (Array.isArray(acceptableTreatments)) {
    matches = acceptableTreatments.indexOf(evaluation.treatment) !== -1;
  }

  log.debug(`[dependencyMatcher] Parent split "${parentName}" evaluated to "${evaluation.treatment}" with label "${evaluation.label}". ${parentName} evaluated treatment is part of [${acceptableTreatments}] ? ${matches}.`);

  return matches;
}

function dependencyMatcherContext({
  split,
  treatments
}, storage) {

  return function dependencyMatcher({
    key,
    attributes
  }, splitEvaluator) {
    log.debug(`[dependencyMatcher] will evaluate parent split: "${split}" with key: ${JSON.stringify(key)} ${ attributes ? `\n attributes: ${JSON.stringify(attributes)}` : ''}`);
    const evaluation = splitEvaluator(key, split, attributes, storage);

    if (thenable(evaluation)) {
      return evaluation.then(ev => checkTreatment(ev, treatments, split));
    } else {
      return checkTreatment(evaluation, treatments, split);
    }
  };
}

export default dependencyMatcherContext;