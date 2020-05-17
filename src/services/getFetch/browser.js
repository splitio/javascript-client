import unfetch from 'unfetch';

export default function getFetch() {
  return window && window.fetch || unfetch;
}