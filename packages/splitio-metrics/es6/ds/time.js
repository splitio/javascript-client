/* @flow */ 'use strict';

require('isomorphic-fetch');

let url = require('../url');

/*::
  type TimeRequest = {
    authorizationKey: string,
    dto: TimeDTO
  }
*/
function timeDataSource({authorizationKey, dto} /*: TimeRequest */) /*: Promise */ {
  return fetch(url(`/metrics/time`), {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`,
      'SplitSDKVersion': 'javascript-1.0'
    },
    mode: 'cors',
    body: JSON.stringify(dto)
  });
}

module.exports = timeDataSource;
