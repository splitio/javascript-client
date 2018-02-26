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
import difference from 'lodash/difference';

function equalToSetMatcherContext(ruleAttr /*: array */) /*: Function */ {
  return function equalToSetMatcher(runtimeAttr /*: array */) /*: boolean */ {
    let isEqual = runtimeAttr.length === ruleAttr.length &&
                  difference(ruleAttr, runtimeAttr).length === 0;

    log.debug(`[equalToSetMatcher] is ${runtimeAttr} equal to set ${ruleAttr}? ${isEqual}`);

    return isEqual;
  };
}

export default equalToSetMatcherContext;