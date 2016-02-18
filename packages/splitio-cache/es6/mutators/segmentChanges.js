/* @flow */ 'use strict';

/*::
  type SegmentChangesDTO {
    name: string,
    added: Array<string>,
    removed: Array<string>
  }
*/
function segmentMutationsFactory({name, added, removed} /*: SegmentChangesDTO */) {

  return function segmentMutations(storageAccesor /*: Function */, storageMutator /*: Function */) {
    let segments;

    // nothing to do here
    if (added.length === 0 && removed.length === 0) {
      return;
    }

    segments = storageAccesor(name);

    added.forEach(segment => segments.add(segment));
    removed.forEach(segment => segments.delete(segment));

    storageMutator(name, segments);
  };

}

module.exports = segmentMutationsFactory;
