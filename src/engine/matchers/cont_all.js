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

/*eslint-disable eqeqeq */

const log = require('debug')('splitio-engine:matcher');
const intersection = require('lodash/intersection');
const isArray = require('lodash/isArray');

function containsAllMatcherContext(vo /*: whitelistObject */) /*: Function */ {
  return function containsAllMatcher(value /*: array */) /*: boolean */ {
    if (!isArray(value)) {
      log(`[containsAllMatcher] value doesn't match, we only accept Array`);

      return false;
    }

    const normalizedValue = value.map(e => e + '');
    let containsAll = false;

    // If value has less elements than whitelist, there is now way that it contains all the whitelist elems.
    if (normalizedValue.length >= vo.whitelist.length) {
      containsAll = intersection(normalizedValue, vo.whitelist).length === vo.whitelist.length;
    }

    log(`[containsAllMatcher] ${value} contains all elements of ${vo.whitelist}? ${containsAll}`);

    return containsAll;
  };
}

module.exports = containsAllMatcherContext;
