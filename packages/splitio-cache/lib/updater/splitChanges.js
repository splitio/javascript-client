'use strict';

var log = require('debug')('splitio-cache:updater');

var splitChangesDataSource = require('../ds/splitChanges');

var storage = require('../storage');
var splitsStorage = storage.splits;
var update = splitsStorage.update.bind(splitsStorage);

function splitChangesUpdater(_ref) {
  var authorizationKey = _ref.authorizationKey;

  log('[' + authorizationKey + '] Updating splitChanges');

  return splitChangesDataSource({ authorizationKey: authorizationKey }).then(function (splitsMutator) {
    return splitsMutator(storage, update);
  }).then(function () {
    return storage;
  });
}

module.exports = splitChangesUpdater;
//# sourceMappingURL=splitChanges.js.map