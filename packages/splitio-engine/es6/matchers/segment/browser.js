/* @flow */ 'use strict';

let log = require('debug')('splitio-engine:matcher');

// Segment Matcher Factory (for the browser).
function matcherSegmentContext(segmentName /*: string */, storage /*: Storage */) /*: Function */ {
  return function segmentMatcher(/* no need for the user key*/) /*: boolean */ {
    let isSegmentInMySegments = storage.segments.has(segmentName);

    log(`[segmentMatcher] evaluated ${segmentName} as ${isSegmentInMySegments}`);

    return isSegmentInMySegments;
  };
}

module.exports = matcherSegmentContext;
