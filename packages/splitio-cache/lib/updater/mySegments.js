/* @flow */'use strict';

var log = require('debug')('splitio-cache:updater');

var mySegmentsDataSource = require('../ds/mySegments');
var storage = require('../storage');

function mySegmentsUpdater(_ref) /*: string */ /*: string */
/*: Promise */{
  var authorizationKey = _ref.authorizationKey;
  var key = _ref.key;

  log('[' + authorizationKey + '] Updating mySegments');

  return mySegmentsDataSource({ authorizationKey: authorizationKey, key: key }).then(function (segmentsMutator) {
    return segmentsMutator(storage.segments.update);
  }).then(function () {
    return storage;
  });
}

module.exports = mySegmentsUpdater;
//# sourceMappingURL=mySegments.js.map