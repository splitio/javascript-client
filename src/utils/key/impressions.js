const isString = require('lodash/isString');
const isObject = require('lodash/isObject');

/**
 * Verify type of key and return a string.
 * Use case: impressions tracker need matching key.
 */
module.exports = (key) => {
  if (isString(key)) {
    return key;
  }

  if (isObject(key)) {
    if (!key.matchingKey) {
      throw 'key should has property matchingKey';
    }

    return key.matchingKey;
  }

  throw 'key should be a object or a string';
};
