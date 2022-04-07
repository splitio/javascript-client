const DEFAULT_ERROR_MARGIN = 50; // 0.05 secs

/**
 * Assert if an `actual` and `expected` numeric values are nearlyEqual.
 *
 * @param {number} actual actual time lapse in millis
 * @param {number} expected expected time lapse in millis
 * @param {number} epsilon error margin in millis
 * @returns {boolean} whether the absolute difference is minor to epsilon value or not
 */
export function nearlyEqual(actual, expected, epsilon = DEFAULT_ERROR_MARGIN) {
  const diff = Math.abs(actual - expected);
  return diff <= epsilon;
}

/**
 * mock the basic behaviour for `/segmentChanges` endpoint:
 *  - when `?since=-1`, it returns the given segment `keys` in `added` list.
 *  - otherwise, it returns empty `added` and `removed` lists, and the same since and till values.
 *
 * @param {Object} fetchMock see http://www.wheresrhys.co.uk/fetch-mock
 * @param {string|RegExp|...} matcher see http://www.wheresrhys.co.uk/fetch-mock/#api-mockingmock_matcher
 * @param {string[]} keys array of segment keys to fetch
 * @param {number} changeNumber optional changeNumber
 */
export function mockSegmentChanges(fetchMock, matcher, keys, changeNumber = 1457552620999) {
  fetchMock.get(matcher, function (url) {
    const since = parseInt(url.split('=').pop());
    const name = url.split('?')[0].split('/').pop();
    return {
      status: 200, body: {
        'name': name,
        'added': since === -1 ? keys : [],
        'removed': [],
        'since': since,
        'till': since === -1 ? changeNumber : since,
      }
    };
  });
}

export function hasNoCacheHeader(fetchMockOpts) {
  return fetchMockOpts.headers['Cache-Control'] === 'no-cache';
}

const eventsEndpointMatcher = /^\/(testImpressions|metrics|events)/;
const authEndpointMatcher = /^\/v2\/auth/;
const streamingEndpointMatcher = /^\/(sse|event-stream)/;

/**
 * Switch URLs servers based on target.
 * Only used for testing purposes.
 *
 * @param {Object} settings settings object
 * @param {String} target url path
 * @return {String}  completed url
 */
export function url(settings, target) {
  if (eventsEndpointMatcher.test(target)) {
    return `${settings.urls.events}${target}`;
  }
  if (authEndpointMatcher.test(target)) {
    return `${settings.urls.auth}${target}`;
  }
  if (streamingEndpointMatcher.test(target)) {
    return `${settings.urls.streaming}${target}`;
  }
  return `${settings.urls.sdk}${target}`;
}
