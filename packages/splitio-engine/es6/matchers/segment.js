'use strict';

var storage = require('splitio-cache/src/storage');
var log = require('debug')('splitio-engine:matcher');

function matcherSegmentContext(segmentName /*: string */) {
  return function segmentMatcher(key /*: string */) {
    let isInSegment = storage.getSegment(segmentName).has(key);

    log(`[segmentMatcher] evaluated ${segmentName} / ${key} => ${isInSegment}`);

    return isInSegment;
  };
}

module.exports = matcherSegmentContext;
