/* @flow */'use strict';

/**
@TODO

1- We are not going to have multiple keys in the same instance of the SDK, so
   there is no need of cache "strategies" for the since value.
3- URLs should be handled in another way, probably reading a configuration file
   so clients could build / configure servers deployments.
4- DataSources could be abstracted because for now, both implementations are the
   same.
5- LOG should be only present while we use development mode.

**/

require('babel-polyfill');
require('isomorphic-fetch');

var log = require('debug')('splitio-cache:http');
var url = require('../url');

var splitMutatorFactory = require('../mutators/splitChanges');
var cache = new Map();

function cacheKeyGenerator(authorizationKey) {
  return authorizationKey + '/splitChanges';
}

function splitChangesDataSource(_ref) {
  var authorizationKey = _ref.authorizationKey;

  var cacheKey = cacheKeyGenerator(authorizationKey);
  var sinceValue = cache.get(cacheKey) || 0;

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

    cache.set(cacheKey, till);

    return splitMutatorFactory(splits);
  }).catch(function (error) {
    log('[' + authorizationKey + '] failure fetching splits using since [' + sinceValue + '] => [' + error + ']');

    return error;
  });
}

module.exports = splitChangesDataSource;
//# sourceMappingURL=splitChanges.js.map