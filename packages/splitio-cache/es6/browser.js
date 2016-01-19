/* @flow */ 'use strict';

require('babel-polyfill');

let mySegmentsDataSource = require('./ds/mySegments');
let splitChangesDataSource = require('./ds/splitChanges');
let storage = require('./storage');

let log = require('debug')('splitio-cache');

function writer(authorizationKey /*: string */, userId /*: string */) /*: Promise */ {
  log(`[${authorizationKey}] Running updater for the browser.`);

  let splitChangesPromise = splitChangesDataSource({authorizationKey}).then(splitsMutator => {
    return splitsMutator(storage.splits.update);
  });

  let mySegmentsPromise = mySegmentsDataSource({authorizationKey, userId}).then(segmentsMutator => {
    return segmentsMutator(storage.segments.update);
  });

  return Promise.all([splitChangesPromise, mySegmentsPromise]).then( () => storage );
}

module.exports = writer;
