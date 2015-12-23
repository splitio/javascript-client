'use strict';

/**
 * Transform the Array structure into a Set.
 *
 * @params {array<string>} items
 * @return Set
 */
function transform(items = []) {
  return new Set(items);
}

module.exports = transform;
