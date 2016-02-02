/* @flow */'use strict';

require('babel-polyfill');

var _splits = new Map();

module.exports = {
  update: function update(splits /*: Array<Split>*/) /*: void */{

    splits.forEach(function (s) {
      if (!s.isGarbage()) {
        _splits.set(s.getKey(), s);
      } else {
        _splits.delete(s.getKey());
      }
    });
  },
  get: function get(featureName /*: string */) /*: Split */{
    return _splits.get(featureName);
  },
  toJSON: function toJSON() {
    return _splits;
  }
};
//# sourceMappingURL=index.js.map