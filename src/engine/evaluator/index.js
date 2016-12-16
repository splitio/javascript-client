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

const engine = require('../engine');
const keyParser = require('../../utils/key');

/*::
  type KeyDTO = {
    matchingKey: string,
    bucketingKey: string
  }
*/

// Evaluator factory
function evaluatorContext(matcherEvaluator /*: function */, treatments /*: Treatments */) /*: function */ {

  return function evaluator(key /*: string | KeyDTO */, seed /*: number */, attributes /*: object */) /*:? string */ {
    // parse key, the key could be a string or KeyDTO it should return a keyDTO.
    const keyParsed = keyParser(key);
    // if the matcherEvaluator return true, then evaluate the treatment
    if (matcherEvaluator(keyParsed.matchingKey, attributes)) {
      return engine.getTreatment(keyParsed.bucketingKey, seed, treatments);
    }

    // else we should notify the engine to continue evaluating
    return undefined;
  };

}

module.exports = evaluatorContext;
