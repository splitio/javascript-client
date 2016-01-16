'use strict';

var segmentChangesDataSource = require('./ds/segmentChanges');
var splitChangesDataSource = require('./ds/splitChanges');
var storage = require('./storage');
var log = require('debug')('splitio-cache');

function writer(authorizationKey) {
  log(`Running updater using key: ${authorizationKey}`);

  return splitChangesDataSource({authorizationKey})
    .then(splitsMutator => {
      return splitsMutator(storage.updateSplit);
    })
    .then(segments => Promise.all(
      [...segments].map(segmentName => segmentChangesDataSource({authorizationKey, segmentName}))
    ))
    .then(segmentsMutators => {
      segmentsMutators.forEach( mutator => mutator(storage.getSegment, storage.updateSegment) );
    })
    .then( () => storage );

}

module.exports = writer;
