/* @flow */'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _segments = new Map();
var log = require('debug')('splitio-cache:segments');

module.exports = {
  update: function update(name /*: string */, segments /*: Set */) /*: void */{
    log('Updating segment ' + name + ' with ' + [].concat(_toConsumableArray(segments)));

    _segments.set(name, segments);
  },
  get: function get(name /*: string */) /*: Set */{
    return _segments.get(name) || new Set();
  },
  toJSON: function toJSON() {
    return _segments;
  }
};
//# sourceMappingURL=node.js.map