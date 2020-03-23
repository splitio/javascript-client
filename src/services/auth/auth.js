import base from '../request';

function userKeyToQueryParam(userKey) {
  // no need to check availability of `encodeURIComponent`, since it is a function highly supported in browsers, node and other platforms.
  return 'users=' + encodeURIComponent(userKey);
}

export default function GET(settings, userKeys) {
  let relativeUrl = '/auth';
  if (userKeys) { // accounting the possibility that `userKeys` is undefined (in node)
    const queryParams = Object.keys(userKeys).map(userKeyToQueryParam).join('&');
    if (queryParams) // accounting the possibility that `userKeys` and thus `queryParams` are empty
      relativeUrl += '?' + queryParams;
  }
  return base(settings, relativeUrl);
}