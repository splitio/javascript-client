
type MySegmentsDTO = Array<string>;

function MySegmentMutationsFactory(mySegments :MySegmentsDTO) :Function {
  function segmentMutations(storageMutator :Function) :void {
    storageMutator(new Set(mySegments));
  }

  return segmentMutations;
}

module.exports = MySegmentMutationsFactory;
