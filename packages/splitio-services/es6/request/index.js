require('isomorphic-fetch');

const url = require('@splitsoftware/splitio-utils/lib/url');
const settings = require('@splitsoftware/splitio-utils/lib/settings');

function RequestFactory(relativeUrl, params) {
  let apiToken = settings.get('authorizationKey');
  let sdkVersion = settings.get('version');

  return new Request(url(relativeUrl), Object.assign({
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
      'SplitSDKVersion': `${sdkVersion}`
    },
    mode: 'cors'
  }, params));
}

module.exports = RequestFactory;
