function mySegmentMutationsFactory(mySegments :Array<string>) {

  return function segmentMutations(storageMutator :Function) {
    storageMutator(new Set(mySegments));
  };

}

module.exports = mySegmentMutationsFactory;
