/* @flow */ 'use strict';

let mySegmentsDataSource = require('../ds/mySegments');
let storage = require('../storage');
let log = require('debug')('splitio-cache:updater');

function mySegmentsUpdater({
  authorizationKey /*: string */, key /*: string */
}) /*: Promise */ {
  log(`[${authorizationKey}] Updating mySegments`);

  return mySegmentsDataSource({authorizationKey, key})
            .then(segmentsMutator => segmentsMutator(storage.segments.update))
            .then(() => storage);
}

module.exports = mySegmentsUpdater;
