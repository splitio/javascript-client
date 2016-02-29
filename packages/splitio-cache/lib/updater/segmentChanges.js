'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = require('debug')('splitio-cache:updater');

var segmentChangesDataSource = require('../ds/segmentChanges');
var storage = require('../storage');

function segmentChangesUpdater(_ref) /*: string */
/*: Promise */{
  var authorizationKey = _ref.authorizationKey;

  log('[' + authorizationKey + '] Updating segmentChanges');

  // Read the list of segments available.
  var segments = storage.splits.getSegments();

  // Per each segment, request the changes and mutate the storage accordingly.
  return _promise2.default.all([].concat((0, _toConsumableArray3.default)(segments)).map(function (segmentName) {
    return segmentChangesDataSource({ authorizationKey: authorizationKey, segmentName: segmentName });
  })).then(function (segmentsMutators) {
    segmentsMutators.forEach(function (mutator) {
      return mutator(storage.segments.get, storage.segments.update);
    });
  }).then(function () {
    return storage;
  });
}

module.exports = segmentChangesUpdater;
//# sourceMappingURL=segmentChanges.js.map