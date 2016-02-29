'use strict';

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var segmentChangesService = require('@splitsoftware/splitio-services/lib/segmentChanges');
var segmentChangesRequest = require('@splitsoftware/splitio-services/lib/segmentChanges/get');

var segmentMutatorFactory = require('../mutators/segmentChanges');
var cache = new _map2.default();

function cacheKeyGenerator(authorizationKey, segmentName) {
  return authorizationKey + '/segmentChanges/' + segmentName;
}

function segmentChangesDataSource(_ref) {
  var authorizationKey = _ref.authorizationKey;
  var segmentName = _ref.segmentName;

  var cacheKey = cacheKeyGenerator(authorizationKey, segmentName);
  var since = cache.get(cacheKey) || -1;

  return segmentChangesService(segmentChangesRequest({
    since: since,
    segmentName: segmentName
  })).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var since = json.since;
    var till = json.till;
    var data = (0, _objectWithoutProperties3.default)(json, ['since', 'till']);


    cache.set(cacheKey, till);

    return segmentMutatorFactory(data);
  });
}

module.exports = segmentChangesDataSource;
//# sourceMappingURL=segmentChanges.js.map