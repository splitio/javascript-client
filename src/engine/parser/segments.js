/**
 * Collect segments from a raw split definition.
 */
const parseSegments = (conditions) => {
  let segments = {};

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