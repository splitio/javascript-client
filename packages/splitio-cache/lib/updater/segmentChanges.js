/* @flow */'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var segmentChangesDataSource = require('../ds/segmentChanges');
var storage = require('../storage');
var log = require('debug')('splitio-cache:updater');

function segmentChangesUpdater(_ref) /*: string */
/*: Promise */{
  var authorizationKey = _ref.authorizationKey;

  log('[' + authorizationKey + '] Updating segmentChanges');

  // Read the list of segments available.
  var segments = storage.splits.getSegments();

  // Per each segment, request the changes and mutate the storage accordingly.
  return Promise.all([].concat(_toConsumableArray(segments)).map(function (segmentName) {
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