import { hash128 } from './murmur3_128';

/**
 * Use instead of parseInt, to not lose precision when converting big integers (greater than 2^53 - 1)
 */
function hex2dec(s /*: string */) /*: string */ {
  let i, j, digits = [0], carry;
  for (i = 0; i < s.length; i += 1) {
    carry = parseInt(s.charAt(i), 16);
    for (j = digits.length - 1; j >= 0; j -= 1) {
      digits[j] = digits[j] * 16 + carry;
      carry = digits[j] / 10 | 0;
      digits[j] %= 10;
    }
    while (carry > 0) {
      digits.unshift(carry % 10);
      carry = carry / 10 | 0;
    }
  }
  return digits.join('');
}

/**
 * Gets the higher 64 bits of the x64 version of Murmur3 for 128bits, as decimal and hexadecimal number strings.
 * Used for MySegments channel V2 notifications.
 * @param {string} str
 */
export function hash64(str /*: string */) /*: { hex: string, dec: string } */ {
  const hex = hash128(str).slice(0, 16);
  return {
    hex, // BoundedFetchRequest notification
    dec: hex2dec(hex) // KeyList notification
  };
}