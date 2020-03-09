import base from '../request';

export default function GET(settings, splitKeys) {
  const queryParams = Object.keys(splitKeys).map(splitKey => 'users=' + splitKey).join('&');
  return base(settings, '/auth?' + queryParams);
}