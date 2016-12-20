/**
 * Verify type of key and return a string.
 * Use case: impressions tracker need matching key.
 */
module.exports = (key) => {
  if (typeof key === 'string') {
    return key;
  }

  if (typeof key === 'object') {
    if (!key.matchingKey) {
      throw 'key should has property matchingKey';
    }

    return key.matchingKey;
  }

  throw 'key should be a object or a string';
};
