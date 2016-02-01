/* @flow */'use strict';

require('babel-polyfill');

/*::
  type MySegmentsDTO = Array<string>;
*/
function mySegmentMutationsFactory(mySegments /*: MySegmentsDTO */) /*: Function */{

  return function segmentMutations(storageMutator /*: Function */) /*: void */{
    storageMutator(new Set(mySegments));
  };
}

module.exports = mySegmentMutationsFactory;
//# sourceMappingURL=mySegments.js.map