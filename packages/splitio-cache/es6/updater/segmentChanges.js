/* @flow */ 'use strict';

let segmentChangesDataSource = require('../ds/segmentChanges');
let storage = require('../storage');
let log = require('debug')('splitio-cache:updater');

function segmentChangesUpdater({
  authorizationKey /*: string */
}) /*: Promise */ {
  log(`[${authorizationKey}] Updating segmentChanges`);

  // Read the list of segments available.
  let segments = storage.splits.getSegments();

  // Per each segment, request the changes and mutate the storage accordingly.
  return Promise.all(
    [...segments].map(segmentName => segmentChangesDataSource({authorizationKey, segmentName}))
  ).then(segmentsMutators => {
    segmentsMutators.forEach(mutator => mutator(storage.segments.get, storage.segments.update));
  }).then(() => storage);
}

module.exports = segmentChangesUpdater;
