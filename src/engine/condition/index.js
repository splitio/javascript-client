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

import engine from '../engine';
import thenable from '../../utils/promise/thenable';
import * as LabelsConstants from '../../utils/labels';

// Build Evaluation object if and only if matchingResult is true
function match(matchingResult, bucketingKey, seed, treatments, label, algo) {
  if (matchingResult) {
    const treatment = engine.getTreatment(bucketingKey, seed, treatments, algo);

    return {
      treatment,
      label
    };
  }

  // else we should notify the engine to continue evaluating
  return undefined;
}

// Condition factory
function conditionContext(matcherEvaluator, treatments, label, conditionType) {

  function conditionEvaluator(key, seed, trafficAllocation, trafficAllocationSeed, splitEvaluator, attributes, algo) {

    // Whitelisting has more priority than traffic allocation, so we don't apply this filtering to those conditions.
    if (conditionType === 'ROLLOUT' && !engine.shouldApplyRollout(trafficAllocation, key.bucketingKey, trafficAllocationSeed, algo)) {
      return {
        treatment: undefined,
        label: LabelsConstants.NOT_IN_SPLIT
      };
    }

    // matcherEvaluator could be Async, this relays on matchers return value, so we need
    // to verify for thenable before play with the result.
    // Also, we pass splitEvaluator function in case we have a matcher that needs to evaluate another split,
    // as well as the entire key object for the same reason.
    const matches = matcherEvaluator(key, attributes, splitEvaluator);

    if (thenable(matches)) {
      return matches.then(result => match(result, key.bucketingKey, seed, treatments, label, algo));
    }

    return match(matches, key.bucketingKey, seed, treatments, label, algo);
  }

  return conditionEvaluator;
}

export default conditionContext;