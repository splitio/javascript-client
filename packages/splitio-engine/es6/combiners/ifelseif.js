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

const log = require('debug')('splitio-engine:combiner');

function ifElseIfCombinerContext(predicates /*: Array<(key: string, seed: number, attributes: object) => ?string)> */) /*: function */ {

  return function ifElseIfCombiner(key /*: string */, seed /*: number */, attributes /*: object */) /*: ?string */ {

    // loop throught the if else if structure and stops as soon as one predicate
    // return a treatment
    for (let evaluator of predicates) {
      let treatment = evaluator(key, seed, attributes);

      if (treatment !== undefined) {
        log('treatment found %s', treatment);

        return treatment;
      }
    }

    log('all predicates evaluted, none treatment available');

    return undefined;
  };

}

module.exports = ifElseIfCombinerContext;
