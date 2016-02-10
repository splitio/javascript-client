/* @flow */ 'use strict';

let mySegmentMutationsFactory = require('../mutators/mySegments');
let url = require('../url');
let log = require('debug')('splitio-cache:http');

/*::
  type MySergmentsRequest = {
    authorizationKey: string,
    key: string
  }
*/
function mySegmentsDataSource({authorizationKey, key} /*: MySergmentsRequest */) /*: Promise */ {
  return fetch(url(`/mySegments/${key}`), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`
    }
  })
  .then(resp => resp.json())
  .then(json => {
    log(`[${authorizationKey}] /mySegments for ${key}`, json);

    return json.mySegments.map(segment => segment.name);
  })
  .then(mySegments => mySegmentMutationsFactory(mySegments))
  .catch(error => {
    log(`[${authorizationKey}] failure fetching my segments [${key}]`);

    return error;
  });
}

module.exports = mySegmentsDataSource;
