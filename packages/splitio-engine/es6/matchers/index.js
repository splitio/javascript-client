/* @flow */ 'use strict';

const types = require('./types').enum;

const allMatcher = require('./all');
const segmentMatcher = require('./segment');
const whitelistMatcher = require('./whitelist');

/*::
  type MatcherAbstract {
    type: Symbol,
    value: undefined | string | Array<string>
  }
*/

// Matcher factory.
function factory(matcherAbstract /*: MatcherAbstract */, storage /*: Storage */) /*: function */ {
  let {type, value} = matcherAbstract;

  if (type === types.ALL) {
    return allMatcher(value);
  } else if (type === types.SEGMENT) {
    return segmentMatcher(value, storage);
  } else if (type === types.WHITELIST) {
    return whitelistMatcher(value);
  }
}

module.exports = factory;
