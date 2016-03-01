const log = require('debug')('splitio-cache:updater');

const splitChangesDataSource = require('../ds/splitChanges');
const storage = require('../storage');

function splitChangesUpdater({authorizationKey}) :Promise {
  log(`[${authorizationKey}] Updating splitChanges`);

  return splitChangesDataSource({authorizationKey})
            .then(splitsMutator => splitsMutator(storage.splits.update))
            .then(() => storage);
}

module.exports = splitChangesUpdater;
