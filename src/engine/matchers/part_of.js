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
const _intersection = require('lodash/intersection');
const _uniq = require('lodash/uniq');

function partOfMatcherContext(vo /*: whitelistObject */) /*: Function */ {
  return function partOfMatcher(value /*: array */) /*: boolean */ {
    let normalizedValue = _uniq(value);
    // If the intersection returns all of value elements, it is a part of vo.value
    let partOf = _intersection(normalizedValue, vo.whitelist).length === normalizedValue.length;

    log(`[partOfMatcher] ${value} is part of ${vo.whitelist}? ${partOf}`);

    return partOf;
  };
}

module.exports = partOfMatcherContext;
