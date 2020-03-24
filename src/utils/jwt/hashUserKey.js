import { encodeToBase64 } from '../base64/node';
import murmur from '../../engine/engine/murmur3';

export function hashUserKey(userKey) {
  return encodeToBase64(murmur.hash(userKey, 0).toString());
}