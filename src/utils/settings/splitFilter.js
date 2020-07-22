import { STANDALONE_MODE } from '../constants';
import { uniq, isString, forOwn, isObject } from '../lang';
import logFactory from '../logger';
const log = logFactory('splitio-settings');

const splitFilterNames = ['byName', 'byPrefix'];
const splitFilterMaxLength = [400, 50];

/**
 * Validates and sanitize a given list of filter values.
 * Exposed for testing purposes.
 *
 * @param {string} filterName string used for log messages
 * @param {string[]} list list to validate and sanitize
 * @param {number} maxLength
 * @returns undefined or sanitized list of values. This means that the list is a non-empty array of unique and ordered non-empty strings.
 * @throws Error if the sanitized list exceeds the length indicated by `maxLength`
 */
function filterValidation(filterName, list, maxLength) {
  if (!Array.isArray(list)) {
    log.error(`Ignoring ${filterName} filter. It must be an array of no-empty strings.`);
    return;
  }

  // remove invalid values (no strings and empty strings)
  let result = list.filter(value => {
    if (!isString(value) || value === '') {
      log.error(`Malformed value in '${filterName}' filter ignored: '${value}'`);
      return false;
    }
    return true;
  });
  // remove duplicated values
  result = uniq(result);
  // sort values
  result.sort();

  // check length
  if (result.length > maxLength) throw new Error(`${maxLength} unique values can be specified at most for '${filterName}' filter. You passed ${result.length}. Please consider reducing the amount or using other filter.`);
  if (result.length === 0) {
    log.error(`Ignoring ${filterName} filter. It has no valid values (no-empty strings).`);
    return;
  }
  return result;
}

/**
 * Returns a string representing the URL encoded query component of /splitChanges URL.
 * Exposed for testing purposes.
 * The possible formats of the query string are:
 *  - '': if both byNameList and byPrefixList are undefined
 *  - 'names=<comma-separated-values>': if only byPrefixList is undefined
 *  - 'prefixes=<comma-separated-values>': if only byNameList is undefined
 *  - 'names=<comma-separated-values>&prefixes=<comma-separated-values>': if no one is undefined
 *
 * @param {string[] | undefined} byNameList undefined or a not empty list of ordered and unique non-empty strings
 * @param {string[] | undefined} byPrefixList undefined or a not empty list of ordered and unique non-empty strings
 */
function queryStringBuilder(byNameList, byPrefixList) {
  const queryParams = [];
  if (byNameList) queryParams.push('names=' + encodeURIComponent(byNameList.join(',')));
  if (byPrefixList) queryParams.push('prefixes=' + encodeURIComponent(byPrefixList.join(',')));
  return queryParams.join('&');
}

/**
 * Validates `splitFilter` configuration object and parses it to build the query string for filtering splits in `/splitChanges` request.
 *
 * @param {Object} settings factory configuration object
 * @returns undefined or sanitized `splitFilter` object with parsed query string.
 * @throws Error if some of the filters exceed the max allowed length
 */
export function splitFilterBuilder(settings) {
  const { splitFilter, mode } = settings;

  // do nothing if `splitFilter` param is not an object or mode is not STANDALONE
  if (!isObject(splitFilter)) return;
  if (mode !== STANDALONE_MODE) {
    log.warn(`splitFilter configuration is ignored if mode is not '${STANDALONE_MODE}'`);
    return;
  }

  // sanitize filters
  forOwn(splitFilter, (value, key, obj) => {
    const filderId = splitFilterNames.indexOf(key);
    if (filderId === -1) {
      log.warn(`'${key}' is an invalid filter. Only 'byName' and 'byPrefix' are valid.`);
      delete obj[key];
    } else {
      obj[key] = filterValidation(key, value, splitFilterMaxLength[filderId]);
    }
  });

  // sanitize `byName` filter
  // if (splitFilter.byName) splitFilter.byName = filterValidation('byName', splitFilter.byName, 400);
  // sanitize `byPrefix` filter
  // if (splitFilter.byPrefix) splitFilter.byPrefix = filterValidation('byPrefix', splitFilter.byName, 400);

  // build query params
  if (splitFilter.byName || splitFilter.byPrefix) splitFilter.queryString = queryStringBuilder(splitFilter.byName, splitFilter.byPrefix);

  return splitFilter;
}
