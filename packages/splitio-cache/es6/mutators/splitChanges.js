/* @flow */ 'use strict';

let parse = require('@splitsoftware/splitio-engine').parse;

function splitMutationsFactory(splits /*: Array<Split> */) /*: Function */ {

  return function splitMutations(storageMutator /*: (collection: Array<Split>) => any */) /*: void */ {

    let splitDtos = [];
    let segmentNamesSet = new Set();

    for (let splitData of splits) {
      let split = parse(splitData);

      splitDtos.push(split);
      segmentNamesSet = new Set([...segmentNamesSet, ...split.getSegments()]);
    }

    storageMutator(splitDtos);

    return segmentNamesSet;
  };

}

module.exports = splitMutationsFactory;
