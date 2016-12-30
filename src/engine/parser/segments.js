// @flow

'use strict';

/**
 * Collect segments from a raw split definition.
 */
const parseSegments = (conditions: Array<Condition>): Set<string> => {
  let segments = new Set();

  for (let condition of conditions) {
    let {
      matcherGroup: {
        matchers
      },
      partitions
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

module.exports = parseSegments;
