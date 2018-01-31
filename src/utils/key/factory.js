import isString from 'lodash/isString';
import isObject from 'lodash/isObject';

/**
 * Verify type of key and return the set key property
 * If shouldReturnUndefined === true will return undefined only if typeof key
 * is a string.
 * Use case: impressions tracker need matching key or bucketing key.
 */
function KeyFactory(keyProperty, shouldReturnUndefined = false) {
  return function getKeyProperty(key) {
    if (isString(key)) {
      return shouldReturnUndefined ? undefined : key;
    }

    if (isObject(key)) {
      if (!key[keyProperty]) {
        throw `key should has property ${keyProperty}`;
      }

      return key[keyProperty];
    }
  };
}

export const matching = KeyFactory('matchingKey');
export const bucketing = KeyFactory('bucketingKey', true);
