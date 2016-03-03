'use strict';

var log = require('debug')('splitio-cache:updater');

var mySegmentsDataSource = require('../ds/mySegments');

var storage = require('../storage');
var segmentsStorage = storage.segments;
var update = segmentsStorage.update.bind(segmentsStorage);

function mySegmentsUpdater(_ref) {
  var authorizationKey = _ref.authorizationKey;
  var key = _ref.key;

  log('[' + authorizationKey + '] Updating mySegments');

  return mySegmentsDataSource({ authorizationKey: authorizationKey, key: key }).then(function (segmentsMutator) {
    return segmentsMutator(update);
  }).then(function () {
    return storage;
  });
}

module.exports = mySegmentsUpdater;
//# sourceMappingURL=mySegments.js.map