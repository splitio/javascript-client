'use strict';

var segmentChangesDataSource = require('./ds/segmentChanges');
var splitChangesDataSource = require('./ds/splitChanges');

var storage = require('./storage');

function writer(authorizationKey) {

  let promise = splitChangesDataSource({authorizationKey})
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

  return promise;

}

//exports.reader = reader;
exports.writer = writer;
