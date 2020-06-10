/**
 * Updates the stored list of segments with the given `segmentNames` list
 *
 * @param {string[]} segmentNames list of segment names
 * @return {boolean} true if the lists differ
 */
export default function resetSegments(segmentNames) {
  let isDiff = false;
  let index;

  // Scan current values from storage
  const storedSegmentNames = this.getRegisteredSegments();

  // Extreme fast => everything is empty
  if (segmentNames.length === 0 && storedSegmentNames.length === segmentNames.length)
    return isDiff;

  // Quick path
  if (storedSegmentNames.length !== segmentNames.length) {
    isDiff = true;
  } else {
    // Slowest path => we need to find at least 1 difference because
    for (index = 0; index < segmentNames.length && storedSegmentNames.indexOf(segmentNames[index]) !== -1; index++) {
      // no-op
    }
    if (index < segmentNames.length) isDiff = true;
  }

  if (isDiff) {
    storedSegmentNames.forEach(segmentName => this.removeFromSegment(segmentName));
    segmentNames.forEach(segmentName => this.addToSegment(segmentName));
  }

  return isDiff;
}
