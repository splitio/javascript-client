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
      throw 'key object should has property bucketingKey and matchingKey';
    }

    return key;
  }

  throw 'key should be a object or a string';
};
