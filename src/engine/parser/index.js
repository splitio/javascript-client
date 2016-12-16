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

const matchersTransform = require('../transforms/matchers');
const treatmentsParser = require('../treatments').parse;

const matcherTypes = require('../matchers/types').enum;
const matcherFactory = require('../matchers');

const value = require('../value');

const evaluatorFactory = require('../evaluator');

const ifElseIfCombiner = require('../combiners/ifelseif');
const andCombiner = require('../combiners/and');

/*::
  type KeyDTO = {
    matchingKey: string,
    bucketingKey: string
  }
*/

/*::
  type ParserOutputDTO = {
    segments: Set,
    evaluator: (key: string | KeyDTO, seed: number) => boolean
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
    let {
      matcherGroup: {
        matchers
      },
      partitions
    } = condition;

    // transform data structure
    matchers = matchersTransform(matchers);

    // create a set of pure functions (key, attr, attributes) => boolean
    let expressions = matchers.map(matcher => {
      // Incrementally collect segmentNames
      if (matcher.type === matcherTypes.SEGMENT) {
        segments.add(matcher.value);
      }

      let fn = matcherFactory(matcher, storage);

      return function expr(key, attributes) {
        return fn(value(key, matcher.attribute, attributes));
      };
    });

    // if matcher's factory can't instanciate the matchers, the expressions array
    // will be empty
    if (expressions.length === 0) {
      // reset any data collected during parsing
      predicates = [];
      segments = new Set();

      break;
    }

    predicates.push(evaluatorFactory(
      andCombiner(expressions),
      treatmentsParser(partitions)
    ));
  }

  // Instanciate evaluator given the set of conditions using if else if logic
  evaluator = ifElseIfCombiner(predicates);

  return {
    evaluator,
    segments
  };
}

module.exports = parse;
