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

const matchersTransform = require('../transforms/matchers');
const treatmentsParser = require('../treatments').parse;
const matcherFactory = require('../matchers');
const value = require('../value');
const evaluatorFactory = require('../evaluator');
const ifElseIfCombiner = require('../combiners/ifelseif');
const andCombiner = require('../combiners/and');

function parse(conditions: Array<Condition>, storage: SplitStorage): any {
  let predicates = [];

  for (let condition of conditions) {
    let {
      matcherGroup: {
        matchers
      },
      partitions,
      label
    } = condition;

    // transform data structure
    matchers = matchersTransform(matchers);

    // create a set of pure functions from the matcher's dto
    const expressions = matchers.map(matcherDto => {
      const matcher = matcherFactory(matcherDto, storage);

      return (key, attributes) => {
        return matcher(
          value(key, matcherDto.attribute, attributes) // value to be matched
        );
      };
    });

    // if matcher's factory can't instanciate the matchers, the expressions array
    // will be empty
    if (expressions.length === 0) {
      // reset any data collected during parsing
      predicates = [];
      // and break the loop
      break;
    }

    predicates.push(evaluatorFactory(
      andCombiner(expressions),
      treatmentsParser(partitions),
      label
    ));
  }

  // Instanciate evaluator given the set of conditions using if else if logic
  return ifElseIfCombiner(predicates);
}

module.exports = parse;
