import { hash128 } from '../../engine/engine/murmur3/murmur3_128';
import { buildKey } from './buildKey';

export function hashImpression128(impression) {
  return hash128(buildKey(impression));
}
