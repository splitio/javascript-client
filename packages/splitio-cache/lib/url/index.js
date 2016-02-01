'use strict';

function hostname(urlWithoutHost) {
  if ('stage' === process.env.NODE_ENV) {
    return 'https://sdk-staging.split.io/api' + urlWithoutHost;
  } else if ('production' === process.env.NODE_ENV) {
    return 'https://sdk.split.io/api' + urlWithoutHost;
  } else {
    return 'http://localhost:8081/api' + urlWithoutHost;
  }
}

module.exports = hostname;
//# sourceMappingURL=index.js.map