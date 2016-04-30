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

function andCombinerContext(matchers /*: Array<function> */) /*: function */ {
  return function andCombiner(...params) /*: boolean */ {
    let i = 0;
    let len = matchers.length;
    let valueHasBeenMatchedAll;

    // loop through all the matchers an stop at the first one returning false.
    for (; i < len && matchers[i](...params); i++) {
      // logic is run inside the condition of evaluates next step.
    }

    valueHasBeenMatchedAll = i === len;

    log(`[andCombiner] is evaluates to ${valueHasBeenMatchedAll}`);

    return valueHasBeenMatchedAll;
  };
}

module.exports = andCombinerContext;
