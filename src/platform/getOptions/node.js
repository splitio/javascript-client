// @TODO
// 1- handle multiple protocols automatically
// 2- destroy it once the sdk is destroyed
import https from 'https';

import { find } from '@splitsoftware/splitio-commons/src/utils/lang';

const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1500
});

export function getOptions(settings) {
  // If some URL is not HTTPS, we don't use the agent, to let the SDK connect to HTTP endpoints
  if (find(settings.urls, url => !url.startsWith('https:'))) return;

  return {
    agent
  };
}
