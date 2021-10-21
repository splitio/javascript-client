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

import { findIndex } from '../../utils/lang';
import { matcherTypes, matcherTypesMapper, matcherDataTypes } from '../matchers/types';
import segmentTransform from './segment';
import whitelistTransform from './whitelist';
import setTransform from './set';
import numericTransform from './unaryNumeric';
import { zeroSinceHH, zeroSinceSS } from '../convertions';

// Flat the complex matcherGroup structure into something handy.
function transform(matchers) {

  let parsedMatchers = matchers.map(matcher => {
    let {
      matcherType                                   /* string */,
      negate                                        /* boolean */,
      keySelector                                   /* keySelectorObject */,
      userDefinedSegmentMatcherData: segmentObject  /* segmentObject */,
      whitelistMatcherData: whitelistObject         /* whiteListObject */,
      unaryNumericMatcherData: unaryNumericObject   /* unaryNumericObject */,
      betweenMatcherData: betweenObject             /* betweenObject */,
      dependencyMatcherData: dependencyObject       /* dependencyObject */,
      booleanMatcherData,
      stringMatcherData
    } = matcher;

    let attribute = keySelector && keySelector.attribute;
    let type = matcherTypesMapper(matcherType);
    // As default input data type we use string (even for ALL_KEYS)
    let dataType = matcherDataTypes.STRING;
    let value = undefined;

    if (type === matcherTypes.IN_SEGMENT) {
      value = segmentTransform(segmentObject);
    } else if (type === matcherTypes.WHITELIST) {
      value = whitelistTransform(whitelistObject);
    } else if (type === matcherTypes.EQUAL_TO) {
      value = numericTransform(unaryNumericObject);
      dataType = matcherDataTypes.NUMBER;

      if (unaryNumericObject.dataType === 'DATETIME') {
        value = zeroSinceHH(value);
        dataType = matcherDataTypes.DATETIME;
      }
    } else if (type === matcherTypes.GREATER_THAN_OR_EQUAL_TO ||
               type === matcherTypes.LESS_THAN_OR_EQUAL_TO) {
      value = numericTransform(unaryNumericObject);
      dataType = matcherDataTypes.NUMBER;

      if (unaryNumericObject.dataType === 'DATETIME') {
        value = zeroSinceSS(value);
        dataType = matcherDataTypes.DATETIME;
      }
    } else if (type === matcherTypes.BETWEEN) {
      value = betweenObject;
      dataType = matcherDataTypes.NUMBER;

      if (betweenObject.dataType === 'DATETIME') {
        value.start = zeroSinceSS(value.start);
        value.end = zeroSinceSS(value.end);
        dataType = matcherDataTypes.DATETIME;
      }
    } else if (
      type === matcherTypes.EQUAL_TO_SET ||
      type === matcherTypes.CONTAINS_ANY_OF_SET ||
      type === matcherTypes.CONTAINS_ALL_OF_SET ||
      type === matcherTypes.PART_OF_SET
    ) {
      value = setTransform(whitelistObject);
      dataType = matcherDataTypes.SET;
    } else if (
      type === matcherTypes.STARTS_WITH ||
      type === matcherTypes.ENDS_WITH ||
      type === matcherTypes.CONTAINS_STRING
    ) {
      value = setTransform(whitelistObject);
    } else if (type === matcherTypes.IN_SPLIT_TREATMENT) {
      value = dependencyObject;
      dataType = matcherDataTypes.NOT_SPECIFIED;
    } else if (type === matcherTypes.EQUAL_TO_BOOLEAN) {
      dataType = matcherDataTypes.BOOLEAN;
      value = booleanMatcherData;
    } else if (type === matcherTypes.MATCHES_STRING) {
      value = stringMatcherData;
    }

    return {
      attribute,        // attribute over we should do the matching, undefined means 'use the key'
      negate,           // should we negate the result?
      type,             // which kind of matcher we should evaluate
      value,            // metadata used for the matching
      dataType          // runtime input data type
    };
  });

  if (findIndex(parsedMatchers, m => m.type === matcherTypes.UNDEFINED) === -1) {
    return parsedMatchers;
  } else {
    return [];
  }
}

export default transform;
