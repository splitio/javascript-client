/* @flow */'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

require('babel-polyfill');

var parse = require('@splitsoftware/splitio-engine').parse;

function splitMutationsFactory(splits /*: Array<Object> */) /*: Function */{

  return function splitMutations(storageMutator /*: (collection: Array<Split>) => any */) /*: void */{
    var dtos = [];
    var segmentNamesSet = new Set();

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = splits[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var s = _step.value;

        var split = parse(s);

        dtos.push(split);
        segmentNamesSet = new Set([].concat(_toConsumableArray(segmentNamesSet), _toConsumableArray(split.getSegments())));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    storageMutator(dtos);

    return segmentNamesSet;
  };
}

module.exports = splitMutationsFactory;
//# sourceMappingURL=splitChanges.js.map