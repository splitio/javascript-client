'use strict';

/**
 * Extract segment name as a plain string.
 */
function transform(segment = {}) {
  return segment.segmentName;
}

module.exports = transform;
