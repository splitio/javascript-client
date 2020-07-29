import { STANDALONE_MODE } from '../constants';
import { validateSplits } from './splits';
import logFactory from '../logger';
const log = logFactory('');

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

function validateFilterType(filterType) {
  return FILTERS_METADATA.some(filterMetadata => filterMetadata.type === filterType);
}

/**
 * Validate, deduplicate and sort a given list of filter values.
 * Exposed for testing purposes.
 *
 * @param {string} type filter type string used for log messages
 * @param {string[]} values list of values to validate, deduplicate and sort
 * @param {number} maxLength
 * @returns undefined or a sanitized list of values. The list is a non-empty array of unique and alphabetically sorted non-empty strings.
 * @throws Error if the sanitized list exceeds the length indicated by `maxLength`
 */
function validateSplitFilter(type, values, maxLength) {
  // validate and remove invalid and duplicated values
  let result = validateSplits(values, 'Factory instantiation', `${type} filter`, `${type} filter value`);

  if (result) {
    // sort values
    result.sort();

    // check max length
    if (result.length > maxLength) throw new Error(`${maxLength} unique values can be specified at most for '${type}' filter. You passed ${result.length}. Please consider reducing the amount or using other filter.`);
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
 * Validates `splitFilters` configuration object and parses it into a query string for filtering splits on `/splitChanges` fetch.
 *
 * @param {Object|undefined} splitFilters split filters configuration param
 * @param {string} mode settings mode
 * @returns undefined or sanitized `splitFilters` array object with parsed `queryString`.
 * @throws Error if the some of the filters exceeds the max allowed length
 */
export default function validateSplitFilters(splitFilters, mode) {

  // do nothing if `splitFilters` param is not a non-empty array or mode is not STANDALONE
  if (!splitFilters) return;
  if (mode !== STANDALONE_MODE) {
    log.warn(`Factory instantiation: split filters have been configured but will have no effect if mode is not '${STANDALONE_MODE}', since synchronization is being deferred to an external tool.`);
    return;
  }
  if (!Array.isArray(splitFilters) || splitFilters.length === 0) {
    log.warn('Factory instantiation: splitFilters configuration must be a non-empty array of filters.');
    return;
  }

  // validate filters and group their values by filter type
  const filters = {
    byName: undefined,
    byPrefix: undefined
  };
  const validFilters = splitFilters.filter((filter, index) => {
    if (filter && validateFilterType(filter.type) && Array.isArray(filter.values)) {
      if (!filters[filter.type]) filters[filter.type] = [];
      filters[filter.type] = filters[filter.type].concat(filter.values);

      return true;
    } else {
      log.warn(`Factory instantiation: split filter at position '${index}' is invalid. It must be an object with a valid 'type' filter and a list of 'values'.`);
    }
    return false;
  });

  // remove invalid, deduplicate and order `byName` and `byPrefix` filter values
  FILTERS_METADATA.forEach(({ type, maxLength }) => {
    if (filters[type]) filters[type] = validateSplitFilter(type, filters[type], maxLength);
  });

  // build query string
  validFilters.queryString = queryStringBuilder(filters);
  if (validFilters.queryString) log.debug(`Factory instantiation: splits filtering criteria is '${validFilters.queryString}'.`);
  validFilters.filters = filters;

  return validFilters;
}
