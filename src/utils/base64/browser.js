const b64re = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;

/**
 * Decode a given string value in Base64 format
 *
 * @param {string} value to decode
 */
export function decodeFromBase64(value) {
  // for browsers (moderns and old ones)
  if (typeof atob === 'function')
    return atob(value);

  // for other environments, such as RN or iOS webWorkers, that do not support neither `atob` or `Buffer`
  // Polyfill from: https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob#Polyfill
  value = String(value).replace(/[\t\n\f\r ]+/g, '');
  value += '=='.slice(2 - (value.length & 3));
  if (!b64re.test(value))
    throw new TypeError('"atob" failed: The string to be decoded is not correctly encoded.');
  var bitmap, result = '',
    r1, r2, i = 0;
  for (; i < value.length;) {
    bitmap = chars.indexOf(value.charAt(i++)) << 18 | chars.indexOf(value.charAt(i++)) << 12 |
      (r1 = chars.indexOf(value.charAt(i++))) << 6 | (r2 = chars.indexOf(value.charAt(i++)));
    result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255) :
      r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255) :
        String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
  }
  return result;
}