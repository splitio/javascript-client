/* @flow */ 'use strict';

let parse = require('@splitsoftware/splitio-engine').parse;

function splitMutationsFactory(splits /*: Array<Object> */) /*: Function */ {

  return function splitMutations(storageMutator /*: (collection: Array<Split>) => any */) /*: void */ {
    let dtos = [];
    let segmentNamesSet = new Set();

    for (let s of splits) {
      let split = parse(s);

      dtos.push(split);
      segmentNamesSet = new Set([...segmentNamesSet, ...split.getSegments()]);
    }

    storageMutator(dtos);

    return segmentNamesSet;
  };

}

module.exports = splitMutationsFactory;
