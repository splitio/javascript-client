import base from '../request';

function userKeyToQueryParam(userKey) {
  // no need to check availability of `encodeURIComponent`, since it is a function highly supported in browsers, node and other platforms.
  return 'users=' + encodeURIComponent(userKey);
}

/**
 *
 * @param {Object} settings Split factory config.
 * @param {string[] | undefined} userKeys set of user Keys to track MY_SEGMENTS_CHANGES. It is undefined for Node.
 */
export default function GET(settings, userKeys) {
  let relativeUrl = '/v2/auth';
  if (userKeys) { // accounting the possibility that `userKeys` is undefined (in node)
    const queryParams = userKeys.map(userKeyToQueryParam).join('&');
    if (queryParams) // accounting the possibility that `userKeys` and thus `queryParams` are empty
      relativeUrl += '?' + queryParams;
  }
  return base(settings, relativeUrl);
}