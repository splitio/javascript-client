'use strict';

var storage = require('split-cache/src/storage');

function matcherSegmentContext(segmentName) {
  return function segmentMatcher(key) {
    return storage.getSegment(segmentName).has(key);
  };
}

module.exports = matcherSegmentContext;
