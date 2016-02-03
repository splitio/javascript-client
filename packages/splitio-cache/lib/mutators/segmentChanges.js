/* @flow */'use strict';

/*::
  type SegmentChangesDTO {
    name: string,
    added: Array<string>,
    removed: Array<string>
  }
*/

function segmentMutationsFactory(_ref /*: SegmentChangesDTO */) {
  var name = _ref.name;
  var added = _ref.added;
  var removed = _ref.removed;

  return function segmentMutations(storageAccesor /*: Function */, storageMutator /*: Function */) {
    var segments = storageAccesor(name);

    added.forEach(function (segment) {
      return segments.add(segment);
    });
    removed.forEach(function (segment) {
      return segments.delete(segment);
    });

    storageMutator(name, segments);
  };
}

module.exports = segmentMutationsFactory;
//# sourceMappingURL=segmentChanges.js.map