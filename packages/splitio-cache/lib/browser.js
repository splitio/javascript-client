/* @flow */'use strict';

require('babel-polyfill');

var mySegmentsDataSource = require('./ds/mySegments');
var splitChangesDataSource = require('./ds/splitChanges');
var storage = require('./storage');

var log = require('debug')('splitio-cache');

function writer(authorizationKey /*: string */, userId /*: string */) /*: Promise */{
  log('[' + authorizationKey + '] Running updater for the browser.');

  var splitChangesPromise = splitChangesDataSource({ authorizationKey: authorizationKey }).then(function (splitsMutator) {
    return splitsMutator(storage.splits.update);
  });

  var mySegmentsPromise = mySegmentsDataSource({ authorizationKey: authorizationKey, userId: userId }).then(function (segmentsMutator) {
    return segmentsMutator(storage.segments.update);
  });

  return Promise.all([splitChangesPromise, mySegmentsPromise]).then(function () {
    return storage;
  });
}

module.exports = writer;
//# sourceMappingURL=browser.js.map