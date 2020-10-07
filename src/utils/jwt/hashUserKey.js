import { encodeToBase64 } from '../base64';
import murmur from '../../engine/engine/murmur3/murmur3';

/**
 * Returns the hash of a given user key
 *
 * @throws {ReferenceError} if `btoa` function is not defined (for browser)
 */
export function hashUserKey(userKey) {
  return encodeToBase64(murmur.hash(userKey, 0).toString());
}