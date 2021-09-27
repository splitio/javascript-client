import { STANDALONE_MODE, FILTERS_METADATA } from '../constants';
import { validateSplits } from './splits';
import logFactory from '../logger';
const log = logFactory('splitio-settings');

function validateFilterType(filterType) {
  return FILTERS_METADATA.some(filterMetadata => filterMetadata.type === filterType);
}

/**
 * Validate, deduplicate and sort a given list of filter values.
 *
 * @param {string} type filter type string used for log messages
 * @param {string[]} values list of values to validate, deduplicate and sort
 * @param {number} maxLength
 * @returns list of valid, unique and alphabetically sorted non-empty strings. The list is empty if `values` param is not a non-empty array or all its values are invalid.
 *
 * @throws Error if the sanitized list exceeds the length indicated by `maxLength`
 */
function validateSplitFilter(type, values, maxLength) {
  // validate and remove invalid and duplicated values
  let result = validateSplits(values, 'settings', `${type} filter`, `${type} filter value`);

  if (result) {
    // check max length
    if (result.length > maxLength) throw new Error(`${maxLength} unique values can be specified at most for '${type}' filter. You passed ${result.length}. Please consider reducing the amount or using other filter.`);

    // sort values
    result.sort();
  }
  return result || []; // returns empty array if `result` is `false`
}

/**
 * Returns a string representing the URL encoded query component of /splitChanges URL.
 *
 * The possible formats of the query string are:
 *  - null: if all filters are empty
 *  - '&names=<comma-separated-values>': if only `byPrefix` filter is undefined
 *  - '&prefixes=<comma-separated-values>': if only `byName` filter is undefined
 *  - '&names=<comma-separated-values>&prefixes=<comma-separated-values>': if no one is undefined
 *
 * @param {Object} groupedFilters object of filters. Each filter must be a list of valid, unique and ordered string values.
 * @returns null or string with the `split filter query` component of the URL.
 */
function queryStringBuilder(groupedFilters) {
  const queryParams = [];
  FILTERS_METADATA.forEach(({ type, queryParam }) => {
    const filter = groupedFilters[type];
    if (filter.length > 0) queryParams.push(queryParam + filter.map(value => encodeURIComponent(value)).join(','));
  });
  return queryParams.length > 0 ? '&' + queryParams.join('&') : null;
}

/**
 * Validates `splitFilters` configuration object and parses it into a query string for filtering splits on `/splitChanges` fetch.
 *
 * @param {Object|undefined} splitFilters split filters configuration param
 * @param {string} mode settings mode
 * @returns it returns an object with the following properties:
 *  - `validFilters`: the validated `splitFilters` configuration object defined by the user.
 *  - `queryString`: the parsed split filter query. it is null if all filters are invalid or all values in filters are invalid.
 *  - `groupedFilters`: list of values grouped by filter type.
 *
 * @throws Error if the some of the grouped list of values per filter exceeds the max allowed length
 */
export default function validateSplitFilters(splitFilters, mode) {
  // Validation result schema
  const res = {
    validFilters: [],
    queryString: null,
    groupedFilters: { byName: [], byPrefix: [] }
  };
  // do nothing if `splitFilters` param is not a non-empty array or mode is not STANDALONE
  if (!splitFilters) return res;
  // Warn depending on the mode
  if (mode !== STANDALONE_MODE) {
    log.warn(`split filters have been configured but will have no effect if mode is not '${STANDALONE_MODE}', since synchronization is being deferred to an external tool.`);
    return res;
  }
  // Check collection type
  if (!Array.isArray(splitFilters) || splitFilters.length === 0) {
    log.warn('splitFilters configuration must be a non-empty array of filter objects.');
    return res;
  }

  // Validate filters and group their values by filter type inside `groupedFilters` object
  res.validFilters = splitFilters.filter((filter, index) => {
    if (filter && validateFilterType(filter.type) && Array.isArray(filter.values)) {
      res.groupedFilters[filter.type] = res.groupedFilters[filter.type].concat(filter.values);
      return true;
    } else {
      log.warn(`split filter at position '${index}' is invalid. It must be an object with a valid filter type ('byName' or 'byPrefix') and a list of 'values'.`);
    }
    return false;
  });

  // By filter type, remove invalid and duplicated values and order them
  FILTERS_METADATA.forEach(({ type, maxLength }) => {
    if (res.groupedFilters[type].length > 0) res.groupedFilters[type] = validateSplitFilter(type, res.groupedFilters[type], maxLength);
  });

  // build query string
  res.queryString = queryStringBuilder(res.groupedFilters);
  log.debug(`splits filtering criteria is '${res.queryString}'.`);

  return res;
}
