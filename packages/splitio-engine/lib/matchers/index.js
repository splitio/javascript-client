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

/*::
  type MatcherAbstract = {
    type: Symbol,
    value: undefined | string | Array<string>
  }
*/

// Matcher factory.
function factory(matcherAbstract /*: MatcherAbstract */, storage /*: Storage */) /*: function */{
  var type = matcherAbstract.type;
  var value = matcherAbstract.value;


  if (type === types.ALL) {
    return allMatcher(value);
  } else if (type === types.SEGMENT) {
    return segmentMatcher(value, storage);
  } else if (type === types.WHITELIST) {
    return whitelistMatcher(value);
  }
}

module.exports = factory;
//# sourceMappingURL=index.js.map