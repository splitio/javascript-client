import { STANDALONE_MODE } from '../constants';
import { uniq, isString } from '../lang';
import logFactory from '../logger';
const log = logFactory('splitio-settings');

/**
 * Validate, deduplicate and sort a given list of filter values.
 * Exposed for testing purposes.
 *
 * @param {string} filterName string used for log messages
 * @param {string[]} list list to validate, deduplicate and sort
 * @param {number} maxLength
 * @returns undefined or a sanitized list of values. The list is a non-empty array of unique and alphabetically sorted non-empty strings.
 * @throws Error if the sanitized list exceeds the length indicated by `maxLength`
 */
function filterValidation(filterName, list, maxLength) {
  // remove invalid values (no strings and empty strings)
  let result = list.filter(value => {
    if (!isString(value) || value === '') {
      log.warn(`Malformed value in '${filterName}' filter ignored: '${value}'`);
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
    log.warn(`Ignoring ${filterName} filter. It has no valid values (no-empty strings).`);
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
 * @param {string[] | undefined} byNameList undefined or list of ordered and unique non-empty strings
 * @param {string[] | undefined} byPrefixList undefined or list of ordered and unique non-empty strings
 * @returns undefined or string with the `query` component of URL.
 */
function queryStringBuilder(byNameList, byPrefixList) {
  const queryParams = [];
  if (byNameList && byNameList.length > 0) queryParams.push('names=' + byNameList.map(value => encodeURIComponent(value)).join(','));
  if (byPrefixList && byPrefixList.length > 0) queryParams.push('prefixes=' + byPrefixList.map(value => encodeURIComponent(value)).join(','));
  return queryParams.length > 0 ? queryParams.join('&') : undefined;
}

/**
 * Validates `splitFilter` configuration object and parses it to build the query string for filtering splits in `/splitChanges` fetch.
 *
 * @param {Object} settings factory configuration object
 * @returns undefined or sanitized `splitFilter` array object with parsed `queryString`.
 * @throws Error if the saniti some of the filters exceed the max allowed length
 */
export function splitFilterBuilder(settings) {
  const { splitFilter, mode } = settings;

  // do nothing if `splitFilter` param is not a non-empty array or mode is not STANDALONE
  if (!splitFilter) return;
  if (mode !== STANDALONE_MODE) {
    log.warn(`Split filters have been configured but will have no effect if mode is not '${STANDALONE_MODE}', since synchronization is being deferred to an external tool`);
    return;
  }
  if (!Array.isArray(splitFilter) || splitFilter.length === 0) {
    log.warn('splitFilter configuration must be a non-empty array of filters');
    return;
  }

  // validate filters and group their values by filter type
  const filters = {
    byName: undefined,
    byPrefix: undefined
  };
  const validFilters = splitFilter.filter((filter, index) => {
    if (filter && isString(filter.type) && Array.isArray(filter.values)) {
      if (Object.prototype.hasOwnProperty.call(filters, filter.type)) {
        if (!filters[filter.type]) filters[filter.type] = [];
        filters[filter.type] = filters[filter.type].concat(filter.values);
        return true;
      } else {
        log.warn(`'${filter.type}' is an invalid filter. Only 'byName' and 'byPrefix' are valid.`);
      }
    } else {
      log.warn(`Split filter at position '${index}' is invalid. It must be an object with a valid 'type' filter and a list of 'values'.`);
    }
    return false;
  });

  // remove invalid, deduplicate and order `byName` and `byPrefix` filter values
  if (filters.byName) filters.byName = filterValidation('byName', filters.byName, 400);
  if (filters.byPrefix) filters.byPrefix = filterValidation('byPrefix', filters.byPrefix, 400);

  // build query string
  validFilters.queryString = queryStringBuilder(filters.byName, filters.byPrefix);
  if (validFilters.queryString) log.debug(`Splits filtering criteria: '${validFilters.queryString}'`);

  return validFilters;
}
