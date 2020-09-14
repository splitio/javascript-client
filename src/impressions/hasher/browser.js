import murmur from '../../engine/engine/murmur3/murmur3';
import { buildKey } from '.';

export function hashImpression32(impression) {
  return impression ? murmur.hash(buildKey(impression)).toString() : null;
}
