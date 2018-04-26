import isObject from 'lodash/isObject';
import sanatize from './sanatize';

/**
 * Verify type of key and return a valid object key used for get treatment for a
 * specific split.
 */
export default (key) => {
  if (isObject(key)) {
    // If we've received an object, we will sanatizes the value of each property
    const keyObject = {
      matchingKey: sanatize(key.matchingKey),
      bucketingKey: sanatize(key.bucketingKey)      
    };

    // and if they've resulted on a invalid type of key we will return false
    if (keyObject.bucketingKey === false || keyObject.matchingKey === false) {
      return false;
    }

    return keyObject;
  }

  const sanatizedKey = sanatize(key);
  
  // sanatize would return false if the key is invalid
  if (sanatizedKey !== false) {
    return {
      matchingKey: sanatizedKey,
      bucketingKey: sanatizedKey
    };
  }

  return false;
};