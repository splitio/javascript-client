/**
 * Decode a given string value in Base64 format
 *
 * @param {string} value to decode
 */
export function decodeFromBase64(value) {
  // for node (version mayor than v4)
  return Buffer.from(value, 'base64').toString('binary');
}