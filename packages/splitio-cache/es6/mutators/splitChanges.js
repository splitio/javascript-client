/* @flow */ 'use strict';

let parse = require('@splitsoftware/splitio-engine').parse;

function splitMutationsFactory(splits /*: Array<Object> */) /*: Function */ {

  return function splitMutations(storageMutator /*: (collection: Array<Split>) => any */) /*: void */ {
    storageMutator(splits.map(parse));
  };

}

module.exports = splitMutationsFactory;
