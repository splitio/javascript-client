
type SegmentChangesDTO = {
  name: string,
  added: Array<string>,
  removed: Array<string>
};

function SegmentMutationsFactory({name, added, removed} :SegmentChangesDTO) :Function {
  function segmentMutations(storageAccesor :Function, storageMutator :Function) :void {
    let segments;

    // nothing to do here
    if (added.length === 0 && removed.length === 0) {
      return;
    }

    segments = storageAccesor(name);

    added.forEach(segment => segments.add(segment));
    removed.forEach(segment => segments.delete(segment));

    storageMutator(name, segments);
  }

  return segmentMutations;
}

module.exports = SegmentMutationsFactory;
