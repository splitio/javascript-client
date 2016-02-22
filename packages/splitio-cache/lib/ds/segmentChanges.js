/* @flow */'use strict';

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('isomorphic-fetch');

var url = require('@splitsoftware/splitio-utils/lib/url');
var log = require('debug')('splitio-cache:http');

var segmentMutatorFactory = require('../mutators/segmentChanges');
var cache = new _map2.default();

function cacheKeyGenerator(authorizationKey, segmentName) {
  return authorizationKey + '/segmentChanges/' + segmentName;
}

function segmentChangesDataSource(_ref) {
  var authorizationKey = _ref.authorizationKey;
  var segmentName = _ref.segmentName;

  var cacheKey = cacheKeyGenerator(authorizationKey, segmentName);
  var sinceValue = cache.get(cacheKey) || -1;

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
    var data = (0, _objectWithoutProperties3.default)(json, ['since', 'till']);


    log('[' + authorizationKey + '] /segmentChanges/' + segmentName + '?since=' + sinceValue, json);

    cache.set(cacheKey, till);

    return segmentMutatorFactory(data);
  }).catch(function (error) {
    log('[' + authorizationKey + '] failure fetching segment [' + segmentName + '] using since [' + sinceValue + '] => [' + error + ']');

    return error;
  });
}

module.exports = segmentChangesDataSource;
//# sourceMappingURL=segmentChanges.js.map