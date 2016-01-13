'use strict';

var parse = require('split-parser').parse;

function splitMutationsFactory(splits) {

  return function splitMutations(storageMutator) {
    let segmentNamesSet = new Set();

    for (let split of splits) {
      split = parse(split);

      storageMutator(split.getKey(), split);

      segmentNamesSet = new Set([...segmentNamesSet, ...split.getSegments()]);
    }

    return segmentNamesSet;
  }

};

module.exports = splitMutationsFactory;
