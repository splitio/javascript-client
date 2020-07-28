import { STANDALONE_MODE } from '../constants';
import { uniq, isString } from '../lang';
import logFactory from '../logger';
const log = logFactory('splitio-settings');

// Filters metadata.
// Ordered according to their precedency when forming the filter query string: `&names=<values>&prefixes=<values>`
const FILTERS_METADATA = [
  {
    type: 'byName',
    maxLength: 400,
    queryParam: 'names='
  },
  {
    type: 'byPrefix',
    maxLength: 50,
    queryParam: 'prefixes='
  }
];

/**
 * Validate, deduplicate and sort a given list of filter values.
 * Exposed for testing purposes.
 *
 * @param {string} type filter type string used for logging messages
 * @param {string[]} values list of values to validate, deduplicate and sort
 * @param {number} maxLength
 * @returns undefined or a sanitized list of values. The list is a non-empty array of unique and alphabetically sorted non-empty strings.
 * @throws Error if the sanitized list exceeds the length indicated by `maxLength`
 */
function filterValidation(type, values, maxLength) {
  // remove invalid values (no strings and empty strings)
  let result = values.filter(value => {
    if (!isString(value) || value === '') {
      log.warn(`Malformed value in '${type}' filter ignored: '${value}'`);
      return false;
    }
    return true;
  });

  // remove duplicated values
  result = uniq(result);

  // sort values
  result.sort();

  // check length
  if (result.length > maxLength) throw new Error(`${maxLength} unique values can be specified at most for '${type}' filter. You passed ${result.length}. Please consider reducing the amount or using other filter.`);
  if (result.length === 0) {
    log.warn(`Ignoring ${type} filter. It has no valid values (no-empty strings).`);
    return;
  }
  return result;
}

/**
 * Returns a string representing the URL encoded query component of /splitChanges URL.
 *
 * The possible formats of the query string are:
 *  - undefined: if all filters are undefined
 *  - '&names=<comma-separated-values>': if only `byPrefix` filter is undefined
 *  - '&prefixes=<comma-separated-values>': if only `byName` filter is undefined
 *  - '&names=<comma-separated-values>&prefixes=<comma-separated-values>': if no one is undefined
 *
 * @param {Object} filters object of filters. Each filter can be undefined or a list of non-empty string values
 * @returns undefined or string with the `filter query` component of the URL.
 */
function queryStringBuilder(filters) {
  const queryParams = [];
  FILTERS_METADATA.forEach(({ type, queryParam }) => {
    const filter = filters[type];
    if (filter && filter.length > 0) queryParams.push(queryParam + filter.map(value => encodeURIComponent(value)).join(','));
  });
  return queryParams.length > 0 ? '&' + queryParams.join('&') : undefined;
}

/**
 * Validates `splitFilters` configuration object and parses it to build the query string for filtering splits in `/splitChanges` fetch.
 *
 * @param {Object} settings factory configuration object
 * @returns undefined or sanitized `splitFilters` array object with parsed `queryString`.
 * @throws Error if the saniti some of the filters exceed the max allowed length
 */
export default function splitFiltersBuilder(settings) {
  const { sync: { splitFilters }, mode } = settings;

  // do nothing if `splitFilters` param is not a non-empty array or mode is not STANDALONE
  if (!splitFilters) return;
  if (mode !== STANDALONE_MODE) {
    log.warn(`Split filters have been configured but will have no effect if mode is not '${STANDALONE_MODE}', since synchronization is being deferred to an external tool`);
    return;
  }
  if (!Array.isArray(splitFilters) || splitFilters.length === 0) {
    log.warn('splitFilters configuration must be a non-empty array of filters');
    return;
  }

  // validate filters and group their values by filter type
  const filters = {
    byName: undefined,
    byPrefix: undefined
  };
  const validFilters = splitFilters.filter((filter, index) => {
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
  FILTERS_METADATA.forEach(({ type, maxLength }) => {
    if (filters[type]) filters[type] = filterValidation(type, filters[type], maxLength);
  });

  // build query string
  validFilters.queryString = queryStringBuilder(filters);
  if (validFilters.queryString) log.debug(`Splits filtering criteria: '${validFilters.queryString}'`);

  return validFilters;
}
