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
const matcherTypes = require('../matchers/types');
const segmentTransform = require('./segment');
const whitelistTransform = require('./whitelist');

/*::
  type dataTypes = null | 'NUMBER' | 'DATETIME';

  type keySelectorObject = {
    trafficType: string,
    attribute: ?string
  };

  type segmentObject = {
    segmentName: string
  };

  type whiteListObject = Array<string>;

  type unaryNumericObject = {
    dataType: dataTypes,
    value: number
  };

  type betweenObject = {
    dataType: dataTypes,
    start: number,
    end: number
  };

  type MatcherDTO = {
    attribute: ?string,
    negate: boolean,
    type: Symbol,
    value: undefined | string | whiteListObject | unaryNumericObject | betweenObject
  };
*/

// Flat the complex matcherGroup structure into something handy.
function transform(matcherGroup /*: object */) /*: MatcherDTO */ {
  let {
    matcherType                                   /*: string */,
    negate                                        /*: boolean */,
    keySelector                                   /*: keySelectorObject */,
    userDefinedSegmentMatcherData: segmentObject  /*: segmentObject */,
    whitelistMatcherData: whitelistObject         /*: whiteListObject */,
    unaryNumericMatcherData: unaryNumericObject   /*: unaryNumericObject */,
    betweenMatcherData: betweenObject             /*: betweenObject */,
  } = matcherGroup.matchers[0];

  let attribute = keySelector && keySelector.attribute;
  let type = matcherTypes.mapper(matcherType);
  let value;

  if (type === matcherTypes.enum.ALL) {
    value = undefined;
  } else if (type === matcherTypes.enum.SEGMENT) {
    value = segmentTransform(segmentObject);
  } else if (type === matcherTypes.enum.WHITELIST) {
    value = whitelistTransform(whitelistObject);
  } else if (type === matcherTypes.enum.EQUAL_TO ||
             type === matcherTypes.enum.GREATER_THAN_OR_EQUAL_TO ||
             type === matcherTypes.enum.LESS_THAN_OR_EQUAL_TO) {
    value = unaryNumericObject;
  } else if (type === matcherTypes.enum.BETWEEN) {
    value = betweenObject;
  }

  return {
    attribute,
    negate,
    type,
    value
  };
}

module.exports = transform;
