/* @flow */'use strict';

var _segments = new Map();
var log = require('debug')('splitio-cache:segments');

module.exports = {
  update: function update(name /*: string */, segments /*: Set */) /*: void */{
    log('Updating segment ' + name + ' with ' + segments);

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