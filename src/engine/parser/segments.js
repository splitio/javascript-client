/**
 * Collect segments from a raw split definition.
 */
const parseSegments = (conditions) => {
  let segments = {};

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
        segments[userDefinedSegmentMatcherData.segmentName] = true;
      }
    }
  }

  return segments;
};

export default parseSegments;