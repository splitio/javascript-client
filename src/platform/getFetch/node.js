/* eslint-disable compat/compat */
import https from 'https';

// @TODO
// 1- handle multiple protocols automatically
// 2- destroy it once the sdk is destroyed
const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1500
});

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

/**
 * Retrieves 'node-fetch', a Fetch API polyfill for NodeJS.
 *
 * @param {import("@splitsoftware/splitio-commons/types/types").ISettings} settings - The settings object used to determine the options.
 * @returns {Object} The options derived from the provided settings.
 */
export function getFetch(settings) {
  const useHttpsAgent = Object.values(settings.urls).every((url) => url.startsWith('https'));

  return nodeFetch && useHttpsAgent ?
    (url, options) => {
      return nodeFetch(url, Object.assign({ agent }, options));
    } :
    nodeFetch;
}
