const DEFAULT_ERROR_MARGIN = 50; // 0.05 secs

/**
 *
 * @param {number} actual
 * @param {number} expected
 * @param {number} epsilon
 */
export function nearlyEqual(actual, expected, epsilon = DEFAULT_ERROR_MARGIN) {
  const diff = Math.abs(actual - expected);
  return diff <= epsilon;
}