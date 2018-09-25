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

import logFactory from '../../utils/logger';
const log = logFactory('splitio-engine:matcher');
import { findIndex } from '../../utils/lang';

function containsAllMatcherContext(ruleAttr /*: array */) /*: Function */ {
  return function containsAllMatcher(runtimeAttr /*: array */) /*: boolean */ {
    let containsAll = true;

    if (runtimeAttr.length < ruleAttr.length) {
      containsAll = false;
    } else {
      for (let i = 0; i < ruleAttr.length && containsAll; i++) {
        if (findIndex(runtimeAttr, e => e === ruleAttr[i]) < 0)
          containsAll = false;
      }
    }

    log.debug(`[containsAllMatcher] ${runtimeAttr} contains all elements of ${ruleAttr}? ${containsAll}`);

    return containsAll;
  };
}

export default containsAllMatcherContext;
