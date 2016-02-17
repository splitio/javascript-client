/* @flow */'use strict';

require('isomorphic-fetch');

var log = require('debug')('splitio-metrics:http');
var url = require('../url');

/*::
  type TimeRequest = {
    authorizationKey: string,
    dto: TimeDTO
  }
*/
function timeDataSource(_ref /*: TimeRequest */) /*: Promise */{
  var authorizationKey = _ref.authorizationKey;
  var dto = _ref.dto;

  return fetch(url('/time'), {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authorizationKey
    },
    body: JSON.stringify(dto)
  });
}

module.exports = timeDataSource;
//# sourceMappingURL=time.js.map