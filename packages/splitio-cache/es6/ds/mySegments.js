/* @flow */ 'use strict';

let mySegmentMutationsFactory = require('../mutators/mySegments');
let url = require('../url');
let log = require('debug')('splitio-cache:http');

/*::
  type MySergmentsRequest = {
    authorizationKey: string,
    userId: string
  }
*/
function mySegmentsDataSource({authorizationKey, userId} /*: MySergmentsRequest */) /*: Promise */ {
  let nocache = Date.now();

  return fetch(url(`/mySegments/${userId}?_nocache=${nocache}`), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`
    }
  })
  .then(resp => resp.json())
  .then(json => {
    log(`[${authorizationKey}] /mySegments for ${userId}`, json);

    return json.mySegments.map(segment => segment.name);
  })
  .then(mySegments => mySegmentMutationsFactory(mySegments))
  .catch(error => {
    log(`[${authorizationKey}] failure fetching my segments [${userId}]`);

    return error;
  });
}

module.exports = mySegmentsDataSource;
