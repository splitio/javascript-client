require('isomorphic-fetch');

const log = require('debug')('splitio-services:transport');

function LoggedFetch(request) {
  return fetch(request)
    .then(resp => {
      log(resp.url);

      return resp;
    })
    .catch(error => {
      log(error);

      throw error;
    });
}

module.exports = LoggedFetch;
