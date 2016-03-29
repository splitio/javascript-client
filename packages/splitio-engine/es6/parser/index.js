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
const matcherGroupTransform = require('../transforms/matcherGroup');
const treatmentsParser = require('../treatments').parse;

const matcherTypes = require('../matchers/types').enum;
const matcherFactory = require('../matchers');

const evaluatorFactory = require('../evaluator');

const andCombiner = require('../combiners/and');

/*::
  type ParserOutputDTO = {
    segments: Set,
    evaluator: (key: string, seed: number) => boolean
  }
*/

// Collect segments and create the evaluator function given a list of
// conditions. This code is the base used by the class `Split` for
// instanciation.
function parse(conditions /*: Iterable<Object> */, storage /*: Storage */) /*: ParserOutputDTO */ {
  let predicates = [];
  let segments = new Set();
  let evaluator = null;

  for (let condition of conditions) {
    let matcherMetadata = matcherGroupTransform(condition.matcherGroup);
    let matcherEvaluator = matcherFactory(matcherMetadata, storage);
    let treatments = treatmentsParser(condition.partitions);

    // if the factory can't instanciate the matcher, the evaluation should
    // return undefined => check default treatment
    if (matcherEvaluator === undefined) {
      predicates = undefined;
      segments = new Set();
      break;
    }

    // Incrementally collect segmentNames
    if (matcherMetadata.type === matcherTypes.SEGMENT) {
      segments.add(matcherMetadata.value);
    }

    predicates.push(evaluatorFactory(matcherEvaluator, treatments));
  }

  // Instanciate evaluator given the set of conditions
  evaluator = andCombiner(predicates);

  return {
    segments,
    evaluator
  };
}

module.exports = parse;
