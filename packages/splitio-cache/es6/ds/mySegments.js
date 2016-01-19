/* @flow */ 'use strict';

require('babel-polyfill');
require('isomorphic-fetch');

let mySegmentMutationsFactory = require('../mutators/mySegments');
let log = require('debug')('splitio-cache:http');

/*::
  type MySergmentsRequest {
    authorizationKey: string,
    userId: string
  }
*/
function mySegmentsDataSource({authorizationKey, userId} /*: MySergmentsRequest */) /*: Promise */ {

  return fetch(`http://localhost:8081/api/mySegments/${userId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`
    }
  })
  .then(resp => resp.json())
  .then(json => json.mySegments.map(segment => segment.name))
  .then(mySegments => mySegmentMutationsFactory(mySegments))
  .catch(error => {
    log(`[${authorizationKey}] failure fetching my segments [${userId}]`);

    return error;
  });
}

module.exports = mySegmentsDataSource;
