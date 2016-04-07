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

var log = require('debug')('splitio-engine:matcher');

var _require = require('../convertions');

var zeroSinceSS = _require.date.zeroSinceSS;


function lessThanEqualMatcherContext(vo /*: unaryNumericObject */) /*: function */{
  return function lessThanEqualMatcher(value /*: string | number */) /*: boolean */{
    // monkey patch datetime to effectily compare on equal
    if (vo.dataType === 'DATETIME') {
      value = zeroSinceSS(value);
    }

    var isLessThanEqual = value !== null ? value <= vo.value : false;

    log('[lessThanEqualMatcher] is ' + value + ' less than ' + vo.value + '? ' + isLessThanEqual);

    return isLessThanEqual;
  };
}

module.exports = lessThanEqualMatcherContext;
//# sourceMappingURL=lte.js.map