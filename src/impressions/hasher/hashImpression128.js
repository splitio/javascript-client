import { hash128 } from '../../engine/engine/murmur3/murmur3_128';
import { buildKey } from '.';

export function hashImpression128(impression) {
  return impression ? hash128(buildKey(impression)).toString() : null;
}
