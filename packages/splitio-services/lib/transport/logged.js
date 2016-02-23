/* @flow */'use strict';

require('isomorphic-fetch');

var log = require('debug')('splitio-services:transport');

function LoggedFetch(request) {
  return fetch(request).then(function (resp) {
    log(resp.url);

    return resp;
  }).catch(function (error) {
    log(error);

    throw error;
  });
}

module.exports = LoggedFetch;
//# sourceMappingURL=logged.js.map