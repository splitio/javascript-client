/* @flow */'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var log = require('debug')('splitio-cache:segments');
var _segments = new Set();

module.exports = {
  update: function update(segments /*: Set */) {
    log('Updating my segments list with [' + [].concat(_toConsumableArray(segments)) + ']');

    _segments = segments;
  },
  has: function has(name /*: string */) /*: boolean */{
    return _segments.has(name);
  },
  toJSON: function toJSON() {
    return _segments;
  }
};
//# sourceMappingURL=browser.js.map