'use strict';

/**
 * Transform the Array structure into a Set.
 *
 * @params {array<string>} items
 * @return Set
 */
function transform(whitelistObject) {
  return new Set(whitelistObject.whitelist);
}

module.exports = transform;
