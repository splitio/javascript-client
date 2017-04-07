const isString = require('lodash/isString');
const isObject = require('lodash/isObject');

/**
 * Verify type of key and return a valid object key used for get treatment for a
 * specific split.
 */
module.exports = (key: any): SplitKeyObject => {
  if (isString(key)) {
    return {
      matchingKey: key,
      bucketingKey: key
    };
  }

  if (isObject(key)) {
    if (!key.bucketingKey || !key.matchingKey) {
      throw 'Key object should have properties bucketingKey and matchingKey.';
    }

    return key;
  }

  throw 'Key should be an string or an object with bucketingKey and matchingKey as string properties.';
};
