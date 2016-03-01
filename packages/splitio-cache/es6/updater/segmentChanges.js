const log = require('debug')('splitio-cache:updater');

const segmentChangesDataSource = require('../ds/segmentChanges');
const storage = require('../storage');

function segmentChangesUpdater({authorizationKey}) :Promise {
  log(`[${authorizationKey}] Updating segmentChanges`);

  // Read the list of segments available.
  const segments = storage.splits.getSegments();

  // Per each segment, request the changes and mutate the storage accordingly.
  return Promise.all(
    [...segments].map(segmentName => segmentChangesDataSource({authorizationKey, segmentName}))
  ).then(segmentsMutators => {
    segmentsMutators.forEach(mutator => mutator(storage.segments.get, storage.segments.update));
  }).then(() => storage);
}

module.exports = segmentChangesUpdater;
