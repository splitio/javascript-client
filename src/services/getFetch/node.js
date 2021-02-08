let nodeFetch = require('node-fetch');

// Handle node-fetch issue https://github.com/node-fetch/node-fetch/issues/1037
if(typeof nodeFetch !== 'function') nodeFetch = nodeFetch.default;

// This function is only exposed for testing purposes.
export function __setFetch(fetch) {
  nodeFetch = fetch;
}

export default function getFetch() {
  return nodeFetch;
}
