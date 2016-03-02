const log = require('debug')('splitio-cache:updater');

const mySegmentsDataSource = require('../ds/mySegments');

const storage = require('../storage');
const segmentsStorage = storage.segments;
const update = segmentsStorage.update.bind(segmentsStorage);

function mySegmentsUpdater({authorizationKey, key}) :Promise {
  log(`[${authorizationKey}] Updating mySegments`);

  return mySegmentsDataSource({authorizationKey, key})
            .then(segmentsMutator => segmentsMutator(update))
            .then(() => storage);
}

module.exports = mySegmentsUpdater;
