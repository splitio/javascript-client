let nodeFetch = require('node-fetch').default;

// This function is only exposed for testing purposes.
export function __setFetch(fetch) {
  nodeFetch = fetch;
}

export default function getFetch() {
  return nodeFetch;
}
