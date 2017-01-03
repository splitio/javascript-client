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

const log = require('debug')('splitio-engine:combiner');

function unexpectedInputHandler() {
  return 'control';
}

function ifElseIfCombinerContext(predicates: Array<Function>): Function {

  async function ifElseIfCombiner(key: SplitKey, seed: number, attributes: Object): Promise<?string> {

    // loop throught the if else if structure and stops as soon as one predicate
    // return a treatment
    for (const evaluator of predicates) {
      const evaluation = await evaluator(key, seed, attributes);

      if (evaluation !== undefined) {
        log('treatment found %s', evaluation.treatment);

        return evaluation;
      }
    }

    log('all predicates evaluted, none treatment available');

    return undefined;
  }

  // if there is none predicates, then there was an error in parsing phase
  if (!Array.isArray(predicates) || Array.isArray(predicates) && predicates.length === 0) {
    return unexpectedInputHandler;
  } else {
    return ifElseIfCombiner;
  }
}

module.exports = ifElseIfCombinerContext;
