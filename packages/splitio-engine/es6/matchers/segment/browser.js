/* @flow */ 'use strict';

let segmentsStorage = require('@splitsoftware/splitio-cache/lib/storage').segments;
let log = require('debug')('splitio-engine:matcher');

/**
 * Segment Matcher Factory (for the browser).
 */
function matcherSegmentContext(segmentName /*: string */) /*: Function */ {
  return function segmentMatcher() /*: boolean */ {
    let isSegmentInMySegments = segmentsStorage.has(segmentName);

    log(`[segmentMatcher] evaluated ${segmentName} as ${isSegmentInMySegments}`);

    return isSegmentInMySegments;
  };
}

module.exports = matcherSegmentContext;
