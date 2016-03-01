const log = require('debug')('splitio-cache:updater');

const mySegmentsDataSource = require('../ds/mySegments');
const storage = require('../storage');

function mySegmentsUpdater({authorizationKey, key}) :Promise {
  log(`[${authorizationKey}] Updating mySegments`);

  return mySegmentsDataSource({authorizationKey, key})
            .then(segmentsMutator => segmentsMutator(storage.segments.update))
            .then(() => storage);
}

module.exports = mySegmentsUpdater;
