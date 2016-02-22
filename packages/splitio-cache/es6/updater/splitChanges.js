/* @flow */ 'use strict';

let log = require('debug')('splitio-cache:updater');

let splitChangesDataSource = require('../ds/splitChanges');
let storage = require('../storage');

function splitChangesUpdater({
  authorizationKey /*: string */
}) /*: Promise */ {
  log(`[${authorizationKey}] Updating splitChanges`);

  return splitChangesDataSource({authorizationKey})
            .then(splitsMutator => splitsMutator(storage.splits.update))
            .then(() => storage);
}

module.exports = splitChangesUpdater;
