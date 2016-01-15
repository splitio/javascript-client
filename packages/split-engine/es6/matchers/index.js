'use strict';

var types = require('./types').enum;

var allMatcher = require('./all');
var segmentMatcher = require('./segment');
var whitelistMatcher = require('./whitelist');

/**
 * Matcher factory.
 *
 * @param {Object} matcherAbstract - Descriptor object with type/value parameters for matchers building.
 *
 * @return {Function} matcher evaluator function
 */
function factory(matcherAbstract) {
  let {type, value} = matcherAbstract;

  if (type === types.ALL) {
    return allMatcher(value);
  } else if (type === types.SEGMENT) {
    return segmentMatcher(value);
  } else if (type === types.WHITELIST) {
    return whitelistMatcher(value);
  }
}

module.exports = factory;
