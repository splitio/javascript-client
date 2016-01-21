/* @flow */'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var segmentChangesDataSource = require('./ds/segmentChanges');
var splitChangesDataSource = require('./ds/splitChanges');
var storage = require('./storage');
var log = require('debug')('splitio-cache');

function writer(authorizationKey) {
  log('[' + authorizationKey + '] Running updater.');

  return splitChangesDataSource({ authorizationKey: authorizationKey }).then(function (splitsMutator) {
    return splitsMutator(storage.splits.update);
  }).then(function (segments) {
    return Promise.all([].concat(_toConsumableArray(segments)).map(function (segmentName) {
      return segmentChangesDataSource({ authorizationKey: authorizationKey, segmentName: segmentName });
    }));
  }).then(function (segmentsMutators) {
    segmentsMutators.forEach(function (mutator) {
      return mutator(storage.segments.get, storage.segments.update);
    });
  }).then(function () {
    return storage;
  });
}

module.exports = writer;
//# sourceMappingURL=node.js.map