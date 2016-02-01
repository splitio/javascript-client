/* @flow */'use strict';

require('babel-polyfill');

var _splits = new Map();

module.exports = {
  update: function update(splits /*: Array<Split>*/) /*: void */{

    splits.forEach(function (s) {
      _splits.set(s.getKey(), s);
    });
  },
  get: function get(featureName /*: string */) /*: Set */{
    return _splits.get(featureName);
  },
  toJSON: function toJSON() {
    return _splits;
  }
};
//# sourceMappingURL=index.js.map