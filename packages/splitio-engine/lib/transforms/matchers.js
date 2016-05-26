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

var matcherTypes = require('../matchers/types');
var segmentTransform = require('./segment');
var whitelistTransform = require('./whitelist');
var findIndex = require('lodash.findindex');

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

var _require = require('../convertions');

var _require$date = _require.date;
var zeroSinceHH = _require$date.zeroSinceHH;
var zeroSinceSS = _require$date.zeroSinceSS;

// Flat the complex matcherGroup structure into something handy.

function transform(matchers /*: Array<object> */) /*: Array<MatcherDTO> */{

  var parsedMatchers = matchers.map(function (matcher) {
    var matcherType /*: string */
    = /*: betweenObject */
    matcher.matcherType;
    var negate /*: boolean */
    = matcher.negate;
    var keySelector /*: keySelectorObject */
    = matcher.keySelector;
    var segmentObject = matcher.userDefinedSegmentMatcherData;
    var whitelistObject = matcher.whitelistMatcherData;
    var unaryNumericObject = matcher.unaryNumericMatcherData;
    var betweenObject = matcher.betweenMatcherData;


    var attribute = keySelector && keySelector.attribute;
    var type = matcherTypes.mapper(matcherType);
    var value = undefined;

    if (type === matcherTypes.enum.SEGMENT) {
      value = segmentTransform(segmentObject);
    } else if (type === matcherTypes.enum.WHITELIST) {
      value = whitelistTransform(whitelistObject);
    } else if (type === matcherTypes.enum.EQUAL_TO) {
      value = unaryNumericObject;

      if (unaryNumericObject.dataType === 'DATETIME') {
        unaryNumericObject.value = zeroSinceHH(unaryNumericObject.value);
      }
    } else if (type === matcherTypes.enum.GREATER_THAN_OR_EQUAL_TO || type === matcherTypes.enum.LESS_THAN_OR_EQUAL_TO) {
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
    }

    return {
      attribute: attribute, // attribute over we should do the matching, undefined means 'use the key'
      negate: negate, // should we negate the result?
      type: type, // which kind of matcher we should evaluate
      value: value // metadata used for the matching
    };
  });

  if (findIndex(parsedMatchers, function (m) {
    return m.type === matcherTypes.enum.UNDEFINED;
  }) === -1) {
    return parsedMatchers;
  } else {
    return [];
  }
}

module.exports = transform;