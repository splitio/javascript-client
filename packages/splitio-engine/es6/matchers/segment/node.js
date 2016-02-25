/* @flow */ 'use strict';

const log = require('debug')('splitio-engine:matcher');

// Segment Matcher Factory.
function matcherSegmentContext(segmentName /*: string */, storage /*: Storage */) {
  return function segmentMatcher(key /*: string */) {
    const isInSegment = storage.segments.get(segmentName).has(key);

    log(`[segmentMatcher] evaluated ${segmentName} / ${key} => ${isInSegment}`);

    return isInSegment;
  };
}

module.exports = matcherSegmentContext;
