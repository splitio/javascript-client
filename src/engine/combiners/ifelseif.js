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

import { findIndex } from '../../utils/lang';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-engine:combiner');
import thenable from '../../utils/promise/thenable';
import * as LabelsConstants from '../../utils/labels';
import { CONTROL } from '../../utils/constants';

function unexpectedInputHandler() {
  log.error('Invalid Split provided, no valid conditions found');

  return {
    treatment: CONTROL,
    label: LabelsConstants.EXCEPTION
  };
}

function computeTreatment(predicateResults) {
  const len = predicateResults.length;

  for (let i = 0; i < len; i++) {
    const evaluation = predicateResults[i];

    if (evaluation !== undefined) {
      log.debug(`Treatment found: ${evaluation.treatment}`);

      return evaluation;
    }
  }

  log.debug('All predicates evaluated, no treatment found.');
  return undefined;
}

function ifElseIfCombinerContext(predicates) {

  function ifElseIfCombiner(key, seed, trafficAllocation, trafficAllocationSeed, attributes, algo, splitEvaluator) {
    // In Async environments we are going to have async predicates. There is none way to know
    // before hand so we need to evaluate all the predicates, verify for thenables, and finally,
    // define how to return the treatment (wrap result into a Promise or not).
    const predicateResults = predicates.map(evaluator => evaluator(key, seed, trafficAllocation, trafficAllocationSeed, splitEvaluator, attributes, algo));

    // if we find a thenable
    if (findIndex(predicateResults, thenable) !== -1) {
      return Promise.all(predicateResults).then(results => computeTreatment(results));
    }

    return computeTreatment(predicateResults);
  }

  // if there is none predicates, then there was an error in parsing phase
  if (!Array.isArray(predicates) || Array.isArray(predicates) && predicates.length === 0) {
    return unexpectedInputHandler;
  } else {
    return ifElseIfCombiner;
  }
}

export default ifElseIfCombinerContext;
