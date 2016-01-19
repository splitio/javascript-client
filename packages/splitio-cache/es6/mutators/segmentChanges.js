/* @flow */ 'use strict';

/**
@TODO

1- Mutations should be applied on the storage and I'm not 100% sure about
   having 2 arguments instead of just provide the data structure as is.
2- Data initialization is part of the implementation, here I have another
   point to think about.
**/

let Set = require('Immutable').Set;

/*::
  type SegmentChangesDTO {
    name: string,
    added: Array<string>,
    removed: Array<string>
  }
*/
function segmentMutationsFactory({name, added, removed} /*: SegmentChangesDTO */) {

  return function segmentMutations(storageAccesor, storageMutator) {
    storageMutator(
      name,
      (storageAccesor(name) || new Set()).union(added).subtract(removed)
    );
  };

}

module.exports = segmentMutationsFactory;
