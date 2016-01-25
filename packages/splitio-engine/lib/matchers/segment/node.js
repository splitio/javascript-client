/* @flow */'use strict';

var segmentsStorage = require('@splitsoftware/splitio-cache/lib/storage').segments;
var log = require('debug')('splitio-engine:matcher');

/**
 * Segment Matcher Factory.
 */
function matcherSegmentContext(segmentName /*: string */) {
  return function segmentMatcher(key /*: string */) {
    var isInSegment = segmentsStorage.get(segmentName).has(key);

    log('[segmentMatcher] evaluated ' + segmentName + ' / ' + key + ' => ' + isInSegment);

    return isInSegment;
  };
}

module.exports = matcherSegmentContext;
//# sourceMappingURL=node.js.map