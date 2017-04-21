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

const log = require('debug')('splitio-engine:matcher');
const intersection = require('lodash/intersection');

function partOfMatcherContext(ruleAttr /*: array */) /*: Function */ {
  return function partOfMatcher(runtimeAttr /*: array */) /*: boolean */ {
    // If the intersection returns all of runtimeAttr elements, it is a part of ruleAttr
    const isPartOf = intersection(runtimeAttr, ruleAttr).length === runtimeAttr.length;

    log(`[partOfMatcher] ${runtimeAttr} is part of ${ruleAttr}? ${isPartOf}`);

    return isPartOf;
  };
}

module.exports = partOfMatcherContext;
