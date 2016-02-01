/* @flow */ 'use strict';

require('babel-polyfill');

/*::
  type SegmentChangesDTO {
    name: string,
    added: Array<string>,
    removed: Array<string>
  }
*/
function segmentMutationsFactory({name, added, removed} /*: SegmentChangesDTO */) {

  return function segmentMutations(storageAccesor /*: Function */, storageMutator /*: Function */) {
    let segments = storageAccesor(name);

    added.forEach(segment => segments.add(segment));
    removed.forEach(segment => segments.delete(segment));

    storageMutator(name, segments);
  };

}

module.exports = segmentMutationsFactory;
