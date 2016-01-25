'use strict';

function hostname(urlWithoutHost) {
  let { NODE_ENV: env } = process.env;

  if ('stage' === env) {
    return `https://sdk-staging.split.io/api${urlWithoutHost}`;
  } else if ('production' === env) {
    return `https://sdk.split.io/api${urlWithoutHost}`;
  } else {
    return `http://localhost:8081/api${urlWithoutHost}`;
  }
}

module.exports = hostname;
