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

import { types } from './types';
import allMatcher from './all';
import segmentMatcher from './segment';
import whitelistMatcher from './whitelist';
import eqMatcher from './eq';
import gteMatcher from './gte';
import lteMatcher from './lte';
import betweenMatcher from './between';
import equalToSetMatcher from './eq_set';
import containsAllSetMatcher from './cont_all';
import containsAnySetMatcher from './cont_any';
import partOfSetMatcher from './part_of';
import swMatcher from './sw';
import ewMatcher from './ew';
import containsStrMatcher from './cont_str';
import dependencyMatcher from './dependency';
import booleanMatcher from './boolean';
import stringMatcher from './string';

/**
 * Matcher factory.
 */
function MatcherFactory(matcherDto, storage) {
  let {
    type,
    value
  } = matcherDto;

  let matcherFn;

  if (type === types.ALL) {
    matcherFn = allMatcher(value);
  } else if (type === types.SEGMENT) {
    matcherFn = segmentMatcher(value, storage);
  } else if (type === types.WHITELIST) {
    matcherFn = whitelistMatcher(value);
  } else if (type === types.EQUAL_TO) {
    matcherFn = eqMatcher(value);
  } else if (type === types.GREATER_THAN_OR_EQUAL_TO) {
    matcherFn = gteMatcher(value);
  } else if (type === types.LESS_THAN_OR_EQUAL_TO) {
    matcherFn = lteMatcher(value);
  } else if (type === types.BETWEEN) {
    matcherFn = betweenMatcher(value);
  } else if (type === types.EQUAL_TO_SET) {
    matcherFn = equalToSetMatcher(value);
  } else if (type === types.CONTAINS_ANY_OF_SET) {
    matcherFn = containsAnySetMatcher(value);
  } else if (type === types.CONTAINS_ALL_OF_SET) {
    matcherFn = containsAllSetMatcher(value);
  } else if (type === types.PART_OF_SET) {
    matcherFn = partOfSetMatcher(value);
  } else if (type === types.STARTS_WITH) {
    matcherFn = swMatcher(value);
  } else if (type === types.ENDS_WITH) {
    matcherFn = ewMatcher(value);
  } else if (type === types.CONTAINS_STRING) {
    matcherFn = containsStrMatcher(value);
  } else if (type === types.IN_SPLIT_TREATMENT) {
    matcherFn = dependencyMatcher(value, storage);
  } else if (type === types.EQUAL_TO_BOOLEAN) {
    matcherFn = booleanMatcher(value);
  } else if (type === types.MATCHES_STRING) {
    matcherFn = stringMatcher(value);
  }

  return matcherFn;
}

export default MatcherFactory;
