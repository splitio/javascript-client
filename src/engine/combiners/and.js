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

import { findIndex } from '../../utils/lang';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-engine:combiner');
import thenable from '../../utils/promise/thenable';

function andResults(results) {
  let i = 0;
  let len = results.length;
  let hasMatchedAll;

  // loop through all the matchers an stop at the first one returning false.
  for (; i < len && results[i]; i++) {
    // logic is run inside the condition of evaluates next step.
  }

  hasMatchedAll = i === len;

  log.debug(`[andCombiner] evaluates to ${hasMatchedAll}`);

  return hasMatchedAll;
}

function andCombinerContext(matchers) {

  function andCombiner(...params) {
    const matcherResults = matchers.map(matcher => matcher(...params));

    // If any matching result is a thenable we should use Promise.all
    if (findIndex(matcherResults, thenable) !== -1) {
      return Promise.all(matcherResults).then(andResults);
    } else {
      return andResults(matcherResults);
    }
  }

  return andCombiner;
}

export default andCombinerContext;
