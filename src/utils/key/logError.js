import isObject from 'lodash/isObject';
import isFinite from 'lodash/isFinite';
import sanatize from './sanatize';
import logFactory from '../logger';
const log = logFactory('splitio-client');

function keyLogError(prefix, key) {
  if (key === null || key === undefined) {
    log.error(`${prefix}: key cannot be null`);
  }

  if (isObject(key)) {
    if (sanatize(key.matchingKey) === false || sanatize(key.bucketingKey) === false) {
      log.error(`${prefix}: key should be an object with bucketingKey and matchingKey with valid string properties`);
    }
  }

  if (isFinite(key)) {
    log.warn(`${prefix}: key ${key} is not of type string, converting to string`);
  }

  if (sanatize(key) === false) {
    log.error(`${prefix}: key has to be of type string`);
  }
}

export default keyLogError;