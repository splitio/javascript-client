/* @flow */'use strict';

var Immutable = require('Immutable');

var segments = new Immutable.Map();

module.exports = {
  update: function update(name /*: string */, segmentSet /*: Set */) /*: void */{
    segments = segments.set(name, segmentSet);
  },
  get: function get(name /*: string */) /*: Set */{
    return segments.get(name);
  },
  toJS: function toJS() /*: string */{
    return segments.toJS();
  }
};
//# sourceMappingURL=node.js.map