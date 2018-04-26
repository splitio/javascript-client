import isObject from 'lodash/isObject';
import sanatize from './sanatize';

/**
 * Verify type of key and return the set key property
 * If shouldReturnUndefined === true will return undefined
 * Use case: impressions tracker need matching key or bucketing key.
 */
function KeyFactory(keyProperty, shouldReturnUndefined = false) {
  return function getKeyProperty(key) {
    if (isObject(key)) {
      const sanatizedProperty = sanatize(key[keyProperty]);

      if (sanatizedProperty !== false) {
        return sanatizedProperty;
      } else {
        return false;
      }
    }

    return shouldReturnUndefined ? undefined : sanatize(key);
  };
}

export const matching = KeyFactory('matchingKey');
export const bucketing = KeyFactory('bucketingKey', true);
