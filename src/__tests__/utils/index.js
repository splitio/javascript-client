const DEFAULT_ERROR_MARGIN = 50; // 0.05 secs

/**
 * Assert if an `actual` and `expected` numeric values are nearlyEqual.
 * 
 * @param {number} actual actual time lapse in millis
 * @param {number} expected expected time lapse in millis
 * @param {number} epsilon error margin in millis
 * @returns {boolean} whether the absolute difference is minor to epsilon value or not
 */
export function nearlyEqual(actual, expected, epsilon = DEFAULT_ERROR_MARGIN) {
  const diff = Math.abs(actual - expected);
  return diff <= epsilon;
}