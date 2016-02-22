/* @flow */'use strict';

require('isomorphic-fetch');

var url = require('@splitsoftware/splitio-utils/lib/url');
var log = require('debug')('splitio-cache:http');

var splitMutatorFactory = require('../mutators/splitChanges');
var sinceValue = -1;

function splitChangesDataSource(_ref) {
  var authorizationKey = _ref.authorizationKey;

  return fetch(url('/splitChanges?since=' + sinceValue), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authorizationKey
    }
  }).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var till = json.till;
    var splits = json.splits;


    log('[' + authorizationKey + '] /splitChanges response using since=' + sinceValue, json);

    sinceValue = till;

    return splitMutatorFactory(splits);
  }).catch(function (error) {
    log('[' + authorizationKey + '] failure fetching splits using since [' + sinceValue + '] => [' + error + ']');

    return error;
  });
}

module.exports = splitChangesDataSource;
//# sourceMappingURL=splitChanges.js.map