import type {
  Thenable
} from '../types';

const log = require('debug')('splitio-cache:updater');

const segmentChangesDataSource = require('../ds/segmentChanges');

const storage = require('../storage');
const segmentsStorage = storage.segments;
const get = segmentsStorage.get.bind(segmentsStorage);
const update = segmentsStorage.update.bind(segmentsStorage);

function segmentChangesUpdater({authorizationKey}) :Thenable {
  log(`[${authorizationKey}] Updating segmentChanges`);

  // Read the list of segments available.
  const segments = storage.splits.getSegments();

  // Per each segment, request the changes and mutate the storage accordingly.
  return Promise.all(
    [...segments].map(segmentName => segmentChangesDataSource({authorizationKey, segmentName}))
  ).then(segmentsMutators => {
    segmentsMutators.forEach(mutator => mutator(get, update));
  }).then(() => storage);
}

module.exports = segmentChangesUpdater;
