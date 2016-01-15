'use strict';

var segmentChangesDataSource = require('./ds/segmentChanges');
var splitChangesDataSource = require('./ds/splitChanges');

var storage = require('./storage');

function writer(authorizationKey) {

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

exports.writer = writer;
