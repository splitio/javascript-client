/**
 * Decode a given string value in Base64 format
 *
 * @param {string} value to decode
 */
export function decodeFromBase64(value) {
  // for node (version mayor than v4)
  return Buffer.from(value, 'base64').toString('binary');
}

/**
 * Encode a given string value to Base64 format
 *
 * @param {string} value to encode
 */
export function encodeToBase64(value) {
  // for node (version mayor than v4)
  return Buffer.from(value).toString('base64');
}