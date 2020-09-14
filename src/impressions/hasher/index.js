const UNKNOWN = 'UNKNOWN';

function _unknownIfNull(s) {
  return s ? s : UNKNOWN;
}

function  _zeroIfNull(l) {
  return l ? l : 0;
}

export function buildKey(impression) {
  return `${_unknownIfNull(impression.keyName)}
    :${_unknownIfNull(impression.feature)}
    :${_unknownIfNull(impression.treatment)}
    :${_unknownIfNull(impression.label)}
    :${_zeroIfNull(impression.changeNumber)}`;
}
