/* @flow */ 'use strict';

try { require('babel-polyfill'); } catch(e) { /* will be replaced using just core-js */ }
require('isomorphic-fetch');

let mySegmentsDataSource = require('./ds/mySegments');
let splitChangesDataSource = require('./ds/splitChanges');
let storage = require('./storage');

let log = require('debug')('splitio-cache');

function writer(authorizationKey /*: string */, key /*: string */) /*: Promise */ {
  log(`[${authorizationKey}] Running updater for the browser.`);

  let splitChangesPromise = splitChangesDataSource({authorizationKey}).then(splitsMutator => {
    return splitsMutator(storage.splits.update);
  });

  let mySegmentsPromise = mySegmentsDataSource({authorizationKey, key}).then(segmentsMutator => {
    return segmentsMutator(storage.segments.update);
  });

  return Promise.all([splitChangesPromise, mySegmentsPromise]).then( () => storage );
}

module.exports = writer;
