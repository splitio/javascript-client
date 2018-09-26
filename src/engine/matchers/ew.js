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
import { endsWith as strEndsWith } from '../../utils/lang';

function endsWithMatcherContext(ruleAttr /*: array */) /*: Function */ {
  return function endsWithMatcher(runtimeAttr /*: string */) /*: boolean */ {
    let endsWith = ruleAttr.some(e => strEndsWith(runtimeAttr, e));

    log.debug(`[endsWithMatcher] ${runtimeAttr} ends with ${ruleAttr}? ${endsWith}`);

    return endsWith;
  };
}

export default endsWithMatcherContext;
