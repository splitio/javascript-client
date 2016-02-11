/* @flow */'use strict';

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

require('isomorphic-fetch');

var log = require('debug')('splitio-cache:http');
var url = require('../url');
var segmentMutatorFactory = require('../mutators/segmentChanges');
var cache = new Map();

function cacheKeyGenerator(authorizationKey, segmentName) {
  return authorizationKey + '/segmentChanges/' + segmentName;
}

function segmentChangesDataSource(_ref) {
  var authorizationKey = _ref.authorizationKey;
  var segmentName = _ref.segmentName;

  var cacheKey = cacheKeyGenerator(authorizationKey, segmentName);
  var sinceValue = cache.get(cacheKey) || 0;

  return fetch(url('/segmentChanges/' + segmentName + '?since=' + sinceValue), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authorizationKey
    }
  }).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var since = json.since;
    var till = json.till;

    var data = _objectWithoutProperties(json, ['since', 'till']);

    cache.set(cacheKey, till);

    return segmentMutatorFactory(data);
  }).catch(function (error) {
    log('[' + authorizationKey + '] failure fetching segment [' + segmentName + '] using since [' + sinceValue + '] => [' + error + ']');

    return error;
  });
}

module.exports = segmentChangesDataSource;
//# sourceMappingURL=segmentChanges.js.map