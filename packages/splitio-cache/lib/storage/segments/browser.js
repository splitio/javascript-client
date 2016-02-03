/* @flow */'use strict';

var _segments = new Set();

module.exports = {
  update: function update(segments /*: Set */) {
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