/* @flow */ 'use strict';

let segmentsStorage = require('splitio-cache/lib/storage').segments;
let log = require('debug')('splitio-engine:matcher');

/**
 * Segment Matcher Factory.
 */
function matcherSegmentContext(segmentName /*: string */) {
  return function segmentMatcher(key /*: string */) {
    let isInSegment = segmentsStorage.get(segmentName).has(key);

    log(`[segmentMatcher] evaluated ${segmentName} / ${key} => ${isInSegment}`);

    return isInSegment;
  };
}

module.exports = matcherSegmentContext;
