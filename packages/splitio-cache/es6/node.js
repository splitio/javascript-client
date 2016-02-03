/* @flow */ 'use strict';

try { require('babel-polyfill'); } catch(e) { /* will be replaced using just core-js */ }
require('isomorphic-fetch');

let segmentChangesDataSource = require('./ds/segmentChanges');
let splitChangesDataSource = require('./ds/splitChanges');
let storage = require('./storage');
let log = require('debug')('splitio-cache');

function writer(authorizationKey) {
  log(`[${authorizationKey}] Running updater.`);

  return splitChangesDataSource({authorizationKey})
    .then(splitsMutator => splitsMutator(storage.splits.update))
    .then(segments => Promise.all(
      [...segments].map(segmentName => segmentChangesDataSource({authorizationKey, segmentName}))
    ))
    .then(segmentsMutators => {
      segmentsMutators.forEach(mutator => mutator(storage.segments.get, storage.segments.update));
    })
    .then( () => storage );

}

module.exports = writer;
