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

import matchersTransform from '../transforms/matchers';
import treatmentsParser from '../treatments';
import matcherFactory from '../matchers';
import sanitizeValue from '../value';
import conditionFactory from '../condition';
import ifElseIfCombiner from '../combiners/ifelseif';
import andCombiner from '../combiners/and';
import thenable from '../../utils/promise/thenable';

function parse(conditions, storage) {
  let predicates = [];

  for (let i = 0; i < conditions.length; i++) {
    let {
      matcherGroup: {
        matchers
      },
      partitions,
      label,
      conditionType
    } = conditions[i];

    // transform data structure
    matchers = matchersTransform(matchers);

    // create a set of pure functions from the matcher's dto
    const expressions = matchers.map(matcherDto => {
      const matcher = matcherFactory(matcherDto, storage);

      // Evaluator function.
      return (key, attributes, splitEvaluator) => {
        const value = sanitizeValue(key, matcherDto, attributes);
        const result = value !== undefined ? matcher(value, splitEvaluator) : false;

        if (thenable(result)) {
          return result.then(res => Boolean(res ^ matcherDto.negate));
        }
        return Boolean(result ^ matcherDto.negate);
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

    predicates.push(conditionFactory(
      andCombiner(expressions),
      treatmentsParser.parse(partitions),
      label,
      conditionType
    ));
  }

  // Instanciate evaluator given the set of conditions using if else if logic
  return ifElseIfCombiner(predicates);
}

export default parse;