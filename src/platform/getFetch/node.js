let nodeFetch;

try {
  nodeFetch = require('node-fetch');

  // Handle node-fetch issue https://github.com/node-fetch/node-fetch/issues/1037
  if (typeof nodeFetch !== 'function') nodeFetch = nodeFetch.default;

} catch (error) {
  // Try to access global fetch if `node-fetch` package couldn't be imported (e.g., not in a Node environment)
  nodeFetch = typeof fetch === 'function' ? fetch : undefined;
}

// This function is only exposed for testing purposes.
export function __setFetch(fetch) {
  nodeFetch = fetch;
}

export function getFetch() {
  return nodeFetch;
}
