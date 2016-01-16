'use strict';

var log = require('debug')('splitio-engine:matcher');

/**
 * Check if a key is inside a whitelist.
 *
 * @param {Set} whitelist - List of keys present in the whitelist
 *
 * @return {function} checker if a given key is present in the whitelist or not.
 */
function whitelistMatcherContext(whitelist /*: Set */) {
  return function whitelistMatcher(key /*: string */) {
    let isInWhitelist = whitelist.has(key);

    log(`[whitelistMatcher] evaluated ${whitelist} / ${key} => ${isInWhitelist}`);

    return isInWhitelist;
  };
}

module.exports = whitelistMatcherContext;
