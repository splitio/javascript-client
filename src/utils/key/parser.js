/**
 * Verify type of key and return a valid object key used for get treatment for a
 * specific split.
 */
module.exports = (key) => {
  if (typeof key === 'string') {
    return {
      matchingKey: key,
      bucketingKey: key
    };
  }

  if (typeof key === 'object') {
    if (!key.bucketingKey || !key.matchingKey) {
      throw 'key object should has property bucketingKey and matchingKey';
    }

    return key;
  }

  throw 'key should be a object or a string';
};
