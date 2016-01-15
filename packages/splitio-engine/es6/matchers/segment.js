'use strict';

var storage = require('splitio-cache/src/storage');

function matcherSegmentContext(segmentName /*: string */) {
  return function segmentMatcher(key /*: string */) {
    return storage.getSegment(segmentName).has(key);
  };
}

module.exports = matcherSegmentContext;
