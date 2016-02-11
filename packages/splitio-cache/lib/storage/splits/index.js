/* @flow */'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _splits = new Map();

module.exports = {
  // Update the internal Map given an Array of new splits.

  update: function update(splits /*: Array<Split>*/) /*: void */{

    splits.forEach(function (s) {
      if (!s.isGarbage()) {
        _splits.set(s.getKey(), s);
      } else {
        _splits.delete(s.getKey());
      }
    });
  },

  // Get the split given a feature name.
  get: function get(featureName /*: string */) /*: Split */{
    return _splits.get(featureName);
  },

  // Get the current Set of segments across all the split instances available.
  getSegments: function getSegments() /*: Set */{
    var collection = new Set();

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _splits[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var split = _step.value;

        collection = new Set([].concat(_toConsumableArray(collection), _toConsumableArray(split.getSegments())));
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

    return collection;
  },

  // Allow stringify of the internal structure.
  toJSON: function toJSON() /*: object */{
    return _splits;
  }
};
//# sourceMappingURL=index.js.map