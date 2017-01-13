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

const engine = require('../engine');
const keyParser = require('../../utils/key/parser');

/**
 * Evaluator factory
 */
function evaluatorContext(matcherEvaluator: Function, treatments: Treatments, label: string): Function {

  async function evaluator(key: SplitKey, seed: number, attributes: ?Object): Promise<?Evaluation> {
    // parse key, the key could be a string or KeyDTO it should return a keyDTO.
    const keyParsed = keyParser(key);
    const matches = await matcherEvaluator(keyParsed.matchingKey, attributes);

    // if matches then evaluate the treatment
    if (matches) {
      const treatment = engine.getTreatment(keyParsed.bucketingKey, seed, treatments);

      return {
        treatment,
        label
      };
    }

    // else we should notify the engine to continue evaluating
    return undefined;
  }

  return evaluator;
}

module.exports = evaluatorContext;
