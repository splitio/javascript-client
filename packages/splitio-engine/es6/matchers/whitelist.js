
'use strict';

/**
 * Check if a key is inside a whitelist.
 *
 * @param {Set} whitelist - List of keys present in the whitelist
 *
 * @return {function} checker if a given key is present in the whitelist or not.
 */
function whitelistMatcherContext(whitelist /*: Set */) {
  return function whitelistMatcher(key /*: string */) {
    return whitelist.has(key);
  };
}

module.exports = whitelistMatcherContext;
