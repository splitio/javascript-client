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
const log = logFactory('splitio-engine');
import legacy from './legacy';
import murmur from './murmur3/murmur3';
const MURMUR_ID = 2;

/**
 * Returns the bucket function by algoId.
 */
function getBucketAlgo(algoId) {
  if (algoId === MURMUR_ID) {
    return murmur.bucket;
  } else {
    return legacy.bucket;
  }
}

const engine = {
  /**
   * Get the treatment name given a key, a seed, and the percentage of each treatment.
   */
  getTreatment(key, seed, treatments, algoId) {
    const bucket = getBucketAlgo(algoId)(key, seed);

    const treatment = treatments.getTreatmentFor(bucket);

    log.debug(`[engine] using algo ${algoId !== MURMUR_ID ? 'legacy' : 'murmur'} bucket ${bucket} for key ${key} using seed ${seed} - treatment ${treatment}`);

    return treatment;
  },
  /**
   * Evaluates the traffic allocation to see if we should apply rollout conditions or not.
   */
  shouldApplyRollout(trafficAllocation, key, trafficAllocationSeed, algoId) {
    // For rollout, if traffic allocation for splits is 100%, we don't need to filter it because everything should evaluate the rollout.
    if (trafficAllocation < 100) {
      const bucket = getBucketAlgo(algoId)(key, trafficAllocationSeed);

      if (bucket > trafficAllocation) {
        return false;
      }
    }
    return true;
  }
};

export default engine;
