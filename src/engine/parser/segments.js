'use strict';

/**
 * Collect segments from a raw split definition.
 */
const parseSegments = (conditions) => {
  let segments = new Set();

  for (let condition of conditions) {
    let {
      matcherGroup: {
        matchers
      }
    } = condition;

    for (let matcher of matchers) {
      const {
        matcherType,
        userDefinedSegmentMatcherData
      } = matcher;

      if (matcherType === 'IN_SEGMENT') {
        segments.add(userDefinedSegmentMatcherData.segmentName);
      }
    }
  }

  return segments;
};

export default parseSegments;