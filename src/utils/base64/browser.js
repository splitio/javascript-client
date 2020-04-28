/**
 * Decode a given string value in Base64 format
 *
 * @param {string} value to decode
 * @throws {ReferenceError} if `atob` function is not defined
 */
export function decodeFromBase64(value) {
  return atob(value);
}

/**
 * Encode a given string value to Base64 format.
 *
 * @param {string} value to encode
 * @throws {ReferenceError} if `btoa` function is not defined
 */
export function encodeToBase64(value) {
  return btoa(value);
}
