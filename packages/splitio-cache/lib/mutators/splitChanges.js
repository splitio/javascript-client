'use strict';

var Split = require('@splitsoftware/splitio-engine');
var parse = Split.parse;

function SplitMutationsFactory(splits) {
  function splitMutations(storage, storageMutator) {
    storageMutator(splits.map(function (split) {
      return parse(split, storage);
    }));
  }

  return splitMutations;
}

module.exports = SplitMutationsFactory;
//# sourceMappingURL=splitChanges.js.map