'use strict';

var Set = require('Immutable').Set;

function segmentMutationsFactory({name, added, removed}) {

  return function segmentMutations(storageAccesor, storageMutator) {
    storageMutator(
      name,
      (storageAccesor(name) || new Set()).union(added).subtract(removed)
    );
  };

};

module.exports = segmentMutationsFactory;
