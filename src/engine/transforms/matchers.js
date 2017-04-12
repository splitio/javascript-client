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

const findIndex = require('core-js/library/fn/array/find-index');

const matcherTypes = require('../matchers/types');
const segmentTransform = require('./segment');
const whitelistTransform = require('./whitelist');

const {
  date: {
    zeroSinceHH,
    zeroSinceSS
  }
} = require('../convertions');

// Flat the complex matcherGroup structure into something handy.
function transform(matchers: Array<Matcher>): Array<ParsedMatcher> {

  let parsedMatchers = matchers.map(matcher => {
    let {
      matcherType                                   /* string */,
      negate                                        /* boolean */,
      keySelector                                   /* keySelectorObject */,
      userDefinedSegmentMatcherData: segmentObject  /* segmentObject */,
      whitelistMatcherData: whitelistObject         /* whiteListObject */,
      unaryNumericMatcherData: unaryNumericObject   /* unaryNumericObject */,
      betweenMatcherData: betweenObject             /* betweenObject */,
      unaryStringMatcherData: unaryStringObject     /* unaryStringObject */
    } = matcher;

    let attribute = keySelector && keySelector.attribute;
    let type = matcherTypes.mapper(matcherType);
    let value = undefined;
    // @TODO: change for case statement
    if (type === matcherTypes.enum.SEGMENT) {
      value = segmentTransform(segmentObject);
    } else if (type === matcherTypes.enum.WHITELIST) {
      value = whitelistTransform(whitelistObject);
    } else if (type === matcherTypes.enum.EQUAL_TO) {
      value = unaryNumericObject;

      if (unaryNumericObject.dataType === 'DATETIME') {
        unaryNumericObject.value = zeroSinceHH(unaryNumericObject.value);
      }
    } else if (type === matcherTypes.enum.GREATER_THAN_OR_EQUAL_TO ||
               type === matcherTypes.enum.LESS_THAN_OR_EQUAL_TO) {
      value = unaryNumericObject;

      if (unaryNumericObject.dataType === 'DATETIME') {
        unaryNumericObject.value = zeroSinceSS(unaryNumericObject.value);
      }
    } else if (type === matcherTypes.enum.BETWEEN) {
      value = betweenObject;

      if (betweenObject.dataType === 'DATETIME') {
        betweenObject.start = zeroSinceSS(betweenObject.start);
        betweenObject.end = zeroSinceSS(betweenObject.end);
      }
    } else if (
      type === matcherTypes.enum.EQUAL_TO_SET ||
      type === matcherTypes.enum.CONTAINS_ANY_OF_SET ||
      type === matcherTypes.enum.CONTAINS_ALL_OF_SET ||
      type === matcherTypes.enum.PART_OF_SET
    ) {
      value = whitelistObject;
    } else if (type === matcherTypes.enum.STARTS_WITH || type === matcherTypes.enum.ENDS_WITH) {
      value = unaryStringObject;
    }

    return {
      attribute, // attribute over we should do the matching, undefined means 'use the key'
      negate,    // should we negate the result?
      type,      // which kind of matcher we should evaluate
      value      // metadata used for the matching
    };
  });

  if (findIndex(parsedMatchers, m => m.type === matcherTypes.enum.UNDEFINED) === -1) {
    return parsedMatchers;
  } else {
    return [];
  }
}

module.exports = transform;
