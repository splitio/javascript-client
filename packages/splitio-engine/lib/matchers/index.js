'use strict';

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

var types = require('./types').enum;

var allMatcher = require('./all');
var segmentMatcher = require('./segment');
var whitelistMatcher = require('./whitelist');
var eqMatcher = require('./eq');
var gteMatcher = require('./gte');
var lteMatcher = require('./lte');
var betweenMatcher = require('./between');

// Matcher factory.
function factory(matcherDto /*: MatcherDTO */, storage /*: Storage */) /*:? function */{
  var negate = matcherDto.negate;
  var type = matcherDto.type;
  var value = matcherDto.value;


  var matcherFn = void 0;

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
  }

  // @TODO this code is not a responsability of the factory, but in terms of
  // mantainability, it's the simplest way to do this. Lets evaluate in the
  // future if make sense to be refactored as a separate matcher.
  if (negate && matcherFn !== undefined) {
    return function negateMatcher() {
      return !matcherFn.apply(undefined, arguments);
    };
  } else {
    return matcherFn;
  }
}

module.exports = factory;