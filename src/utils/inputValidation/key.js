import {
  isObject, isString, numberIsFinite,
  toString
} from '../lang';
import logFactory from '../logger';
const log = logFactory('');

const KEY_MAX_LENGTH = 250;

function validateKeyValue(maybeKey, method, type) {
  if (maybeKey == undefined) { // eslint-disable-line eqeqeq
    log.error(`${method}: you passed a null or undefined ${type}, ${type} must be a non-empty string.`);
    return false;
  }
  if (numberIsFinite(maybeKey)) {
    log.warn(`${method}: ${type} "${maybeKey}" is not of type string, converting.`);
    return toString(maybeKey);
  }
  if (isString(maybeKey)) {
    // It's a string, start by trimming the value.
    maybeKey = maybeKey.trim();

    // It's aaaaaall good.
    if (maybeKey.length > 0 && maybeKey.length <= KEY_MAX_LENGTH) return maybeKey;

    if (maybeKey.length === 0) {
      log.error(`${method}: you passed an empty string, ${type} must be a non-empty string.`);
    } else if(maybeKey.length > KEY_MAX_LENGTH) {
      log.error(`${method}: ${type} too long, ${type} must be 250 characters or less.`);
    }
  } else {
    log.error(`${method}: you passed an invalid ${type} type, ${type} must be a non-empty string.`);
  }

  return false;
}

export function validateKey(maybeKey, method) {
  if (isObject(maybeKey)) {
    // Validate key object
    const matchingKey = validateKeyValue(maybeKey.matchingKey, method, 'matchingKey');
    const bucketingKey = validateKeyValue(maybeKey.bucketingKey, method, 'bucketingKey');

    if (matchingKey && bucketingKey) return {
      matchingKey, bucketingKey
    };

    log.error(`${method}: Key must be an object with bucketingKey and matchingKey with valid string properties.`);
    return false;
  } else {
    return validateKeyValue(maybeKey, method, 'key');
  }
}
