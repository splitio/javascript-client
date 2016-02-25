/* @flow */'use strict';

var types = require('./types').enum;

var allMatcher = require('./all');
var segmentMatcher = require('./segment');
var whitelistMatcher = require('./whitelist');

/*::
  type MatcherAbstract {
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