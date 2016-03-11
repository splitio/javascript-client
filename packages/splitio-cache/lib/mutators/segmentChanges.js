"use strict";

function SegmentMutationsFactory(_ref) {
  var name = _ref.name;
  var added = _ref.added;
  var removed = _ref.removed;

  function segmentMutations(storageAccesor, storageMutator) {
    var segments = void 0;

    // nothing to do here
    if (added.length === 0 && removed.length === 0) {
      return;
    }

    segments = storageAccesor(name);

    added.forEach(function (segment) {
      return segments.add(segment);
    });
    removed.forEach(function (segment) {
      return segments.delete(segment);
    });

    storageMutator(name, segments);
  }

  return segmentMutations;
}

module.exports = SegmentMutationsFactory;
//# sourceMappingURL=segmentChanges.js.map