/**
 *
 * @param {number} actual
 * @param {number} expected
 * @param {number} epsilon
 */
export function nearlyEqual(actual, expected, epsilon) {
  return actual >= expected - epsilon && actual <= expected + epsilon;
}