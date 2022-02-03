import unfetch from 'unfetch';

export function getFetch() {
  return typeof fetch === 'function' ? fetch : unfetch;
}
