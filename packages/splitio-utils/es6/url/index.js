'use strict';

function url(target) {
  if ('stage' === process.env.NODE_ENV) {
    return `https://sdk-staging.split.io/api${target}`;
  } else if ('production' === process.env.NODE_ENV) {
    return `https://sdk.split.io/api${target}`;
  } else if ('loadtesting' === process.env.NODE_ENV) {
    return `https://sdk-loadtesting.split.io/api${target}`;
  } else {
    return `http://localhost:8081/api${target}`;
  }
}

module.exports = url;
