/* @flow */ 'use strict';

let log = require('debug')('splitio-engine:matcher');

/**
 * White list Matcher Factory.
 */
function whitelistMatcherContext(whitelist /*: Set */) /*: Function */ {
  return function whitelistMatcher(key /*: string */) /*: boolean */ {
    let isInWhitelist = whitelist.has(key);

    log(`[whitelistMatcher] evaluated key ${key} in [${[...whitelist].join(',')}] => ${isInWhitelist}`);

    return isInWhitelist;
  };
}

module.exports = whitelistMatcherContext;
