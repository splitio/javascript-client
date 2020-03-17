
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/**
 * Encode a given string value to Base64 format
 *
 * @param {string} value to encode
 */
export function encodeToBase64(value) {
  // for browsers (moderns and old ones)
  if (typeof btoa === 'function')
    return btoa(value);

  // for node (version mayor than v4)
  if (typeof Buffer === 'function')
    return Buffer.from(value).toString('base64');

  // for other environments, such as RN
  let output = '';

  for (let block = 0, charCode, i = 0, map = chars;
    value.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

    charCode = value.charCodeAt(i += 3 / 4);

    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }

    block = block << 8 | charCode;
  }

  return output;
}

import murmur from '../../engine/engine/murmur3';

export function hashUserKey(userKey) {
  // @REVIEW add some validation for userKey?
  return encodeToBase64(murmur.hash(userKey, 0).toString());
}