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

const log = require('debug')('splitio-engine');

const legacy = require('./legacy');
const murmur = require('./murmur3');

const engine = {
  /**
   * Get the treatment name given a key, a seed, and the percentage of each treatment.
   */
  getTreatment(key: string, seed: number, treatments: Treatments, algo: ?number): string {
    let bucket;

    if (algo === 2) {
      bucket = murmur.bucket(key, seed);
    } else {
      bucket = legacy.bucket(key, seed);
    }

    const treatment = treatments.getTreatmentFor(bucket);

    log(`[engine] using algo ${algo !== 2 ? 'legacy' : 'murmur'} bucket ${bucket} for ${key} using seed ${seed} - treatment ${treatment}`);

    return treatment;
  }
};

module.exports = engine;
