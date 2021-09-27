import unfetch from 'unfetch';

export default function getFetch() {
  return typeof fetch === 'function' ? fetch : unfetch;
}