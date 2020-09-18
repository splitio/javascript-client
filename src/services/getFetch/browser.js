import unfetch from 'unfetch';

export default function getFetch() {
  // eslint-disable-next-line compat/compat
  return typeof window !== 'undefined' && window.fetch || unfetch;
}