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

function andCombinerContext(matchers: Array<Function>): Function {

  async function andCombiner(...params): Promise<boolean> {
    return Promise.all(matchers.map(matcher => matcher(...params))).then(results => {
      let i = 0;
      let len = results.length;
      let hasMatchedAll;

      // loop through all the matchers an stop at the first one returning false.
      for (; i < len && results[i]; i++) {
        // logic is run inside the condition of evaluates next step.
      }

      hasMatchedAll = i === len;

      log(`[andCombiner] is evaluates to ${hasMatchedAll ? 'true' : 'false'}`);

      return hasMatchedAll;
    });
  }

  return andCombiner;
}

module.exports = andCombinerContext;
