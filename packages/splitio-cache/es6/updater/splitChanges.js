import type {
  Thenable
} from '../types';

const log = require('debug')('splitio-cache:updater');

const splitChangesDataSource = require('../ds/splitChanges');

const storage = require('../storage');
const splitsStorage = storage.splits;
const update = splitsStorage.update.bind(splitsStorage);

function splitChangesUpdater({authorizationKey}) :Thenable {
  log(`[${authorizationKey}] Updating splitChanges`);

  return splitChangesDataSource({authorizationKey})
            .then(splitsMutator => splitsMutator(storage, update))
            .then(() => storage);
}

module.exports = splitChangesUpdater;
