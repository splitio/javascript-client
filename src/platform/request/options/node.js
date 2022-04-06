// @TODO
// 1- handle multiple protocols automatically
// 2- destroy it once the sdk is destroyed
import https from 'https';

const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1500
});

export function getOptions() {
  return {
    agent
  };
}
