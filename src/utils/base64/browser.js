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

import murmur from '../../engine/engine/murmur3';

/**
 * Returns the hash of a given user key
 *
 * @throws {ReferenceError} if `btoa` function is not defined
 */
export function hashUserKey(userKey) {
  return encodeToBase64(murmur.hash(userKey, 0).toString());
}