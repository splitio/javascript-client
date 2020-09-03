import murmur from '../engine/engine/murmur3';

const UNKNOWN = 'UNKNOWN';

function _unknownIfNull(s) {
  return (s) ? s : UNKNOWN;
}

function  _zeroIfNull(l) {
  return (l) ? l : 0;
}

function hashImpression(impression) {
  return impression ? murmur.hash128(
    `${_unknownIfNull(impression.keyName)}
    :${_unknownIfNull(impression.feature)}
    :${_unknownIfNull(impression.treatment)}
    :${_unknownIfNull(impression.label)}
    :${_zeroIfNull(impression.changeNumber)}`
  ).substring(0, 16) : null;
}

export default hashImpression;