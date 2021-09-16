import murmur from '../../engine/engine/murmur3/murmur3';
import { buildKey } from './buildKey';

export function hashImpression32(impression) {
  return murmur.hash(buildKey(impression));
}
