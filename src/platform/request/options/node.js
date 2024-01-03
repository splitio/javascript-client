import { forOwn } from '@splitsoftware/splitio-commons/src/utils/lang';

// @TODO
// 1- handle multiple protocols automatically
// 2- destroy it once the sdk is destroyed
import https from 'https';

const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1500
});

/**
 * Retrieves fetch options for NodeJS
 *
 * @param {import("@splitsoftware/splitio-commons/types/types").ISettings} settings - The settings object used to determine the options.
 * @returns {Object} The options derived from the provided settings.
 */
export function getOptions(settings) {
  let useHttpsAgent = true;

  forOwn(settings.urls, (url) => {
    if (url.indexOf('https') !== 0) useHttpsAgent = false;
  });

  return {
    agent: useHttpsAgent ? agent : false,
  };
}
