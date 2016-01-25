/* @flow */'use strict';

require('babel-polyfill');
require('isomorphic-fetch');

var mySegmentMutationsFactory = require('../mutators/mySegments');
var url = require('../url');
var log = require('debug')('splitio-cache:http');

/*::
  type MySergmentsRequest {
    authorizationKey: string,
    userId: string
  }
*/
function mySegmentsDataSource(_ref /*: MySergmentsRequest */) /*: Promise */{
  var authorizationKey = _ref.authorizationKey;
  var userId = _ref.userId;

  return fetch(url('/mySegments/' + userId), {
    method: 'GET',
    headers: {
      'SARASA': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authorizationKey
    }
  }).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    return json.mySegments.map(function (segment) {
      return segment.name;
    });
  }).then(function (mySegments) {
    return mySegmentMutationsFactory(mySegments);
  }).catch(function (error) {
    log('[' + authorizationKey + '] failure fetching my segments [' + userId + ']');

    return error;
  });
}

module.exports = mySegmentsDataSource;
//# sourceMappingURL=mySegments.js.map