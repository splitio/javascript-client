"use strict";

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function MySegmentMutationsFactory(mySegments) {
  function segmentMutations(storageMutator) {
    storageMutator(new _set2.default(mySegments));
  }

  return segmentMutations;
}

module.exports = MySegmentMutationsFactory;
//# sourceMappingURL=mySegments.js.map