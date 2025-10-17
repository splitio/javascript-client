let __setFetchCalled = false;
let nodeFetchImport;

let nodeFetch = (url, options) => {
  try {
    if (!nodeFetchImport) {
      // lazy import, recommended for other runtimes than Node.js
      nodeFetchImport = import('node-fetch').then(({ default: fetch }) => {
        if (!__setFetchCalled) nodeFetch = fetch;
      }).catch(() => {
        if (!__setFetchCalled) nodeFetch = typeof fetch === 'function' ? fetch : undefined;
      });
    }

    return nodeFetchImport.then(() => {
      if (!nodeFetch) throw new Error('Fetch API not available');
      return nodeFetch(url, options);
    });
  } catch (error) {
    if (!__setFetchCalled) nodeFetch = typeof fetch === 'function' ? fetch : undefined;
    if (!nodeFetch) throw new Error('Fetch API not available');
    return nodeFetch(url, options);
  }
};

// This function is only exposed for testing purposes.
export function __setFetch(fetch) {
  __setFetchCalled = true;
  nodeFetch = fetch;
}

/**
 * Retrieves 'node-fetch', a Fetch API polyfill for Node.js, with fallback to global 'fetch' if available.
 */
export function getFetch() {
  return nodeFetch;
}
