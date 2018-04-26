import isString from 'lodash/isString';
import isFinite from 'lodash/isFinite';
import toString from 'lodash/toString';

function sanatizeKey(key) {
  if (isString(key) || isFinite(key)) {
    return toString(key);
  }

  return false;
} 

export default sanatizeKey;