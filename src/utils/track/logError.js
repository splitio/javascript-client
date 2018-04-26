import isString from 'lodash/isString';
import logFactory from '../logger';
const log = logFactory('splitio-client');

function trackLogError(value, label, isValidEmptyString = true) {
  if (value === null || value === undefined) {
    log.error(`track: ${label} cannot be null`);
  }

  if (isString(value)) {
    log.error(`track: ${label} must be a string`);
  }

  if (!isValidEmptyString && (isString(value) && !value.length)) {
    log.error(`track: ${label} must not be an empty String`);
  }
}

export default trackLogError;