import base from '../request';

export default function GET(settings, splitKeys) {
  let relativeUrl = '/auth';
  if (splitKeys) { // accounting the possibility that splitKeys is undefined
    const queryParams = Object.keys(splitKeys).map(splitKey => 'users=' + splitKey).join('&');
    if (queryParams) relativeUrl += '?' + queryParams;  // accounting the possibility that `splitKeys` and thus `queryParams` are empty
  }
  return base(settings, relativeUrl);
}