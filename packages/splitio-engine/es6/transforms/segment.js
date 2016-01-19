/* @flow */ 'use strict';

/**
 * Extract segment name as a plain string.
 */
function transform(segment = {} /*: object */) /*: string */ {
  return segment.segmentName;
}

module.exports = transform;
