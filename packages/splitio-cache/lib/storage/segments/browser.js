/* @flow */'use strict';

var Immutable = require('Immutable');

var segments = new Immutable.Set();

module.exports = {
  update: function update(newSegments /*: Set */) {
    segments = newSegments;
  },
  has: function has(name /*: string */) /*: boolean */{
    return segments.has(name);
  },
  toJS: function toJS() /*: string */{
    return segments.toJS();
  }
};
//# sourceMappingURL=browser.js.map