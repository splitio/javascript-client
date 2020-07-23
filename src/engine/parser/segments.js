import { _Set } from '../../utils/lang/Sets';

/**
 * Collect segments from a raw split definition.
 */
const parseSegments = (conditions) => {
  let segments = new _Set();

  conditions.forEach(condition => {
    let {
      matcherGroup: {
        matchers
      }
    } = condition;

    matchers.forEach(matcher => {
      const {
        matcherType,
        userDefinedSegmentMatcherData
      } = matcher;

      if (matcherType === 'IN_SEGMENT') {
        segments[userDefinedSegmentMatcherData.segmentName] = true;
      }
    });
  });

  return segments;
};

export default parseSegments;