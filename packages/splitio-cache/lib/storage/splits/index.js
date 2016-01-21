/* @flow */'use strict';

var Immutable = require('Immutable');

var splits = new Immutable.Map();

module.exports = {
  update: function update(updatedSplits /*: Array<Split>*/) /*: void */{
    splits = splits.withMutations(function (splits) {
      updatedSplits.forEach(function (updatedSplit) {
        splits = splits.set(updatedSplit.getKey(), updatedSplit);
      });

      return splits;
    });
  },
  get: function get(featureName /*: string */) /*: Set */{
    return splits.get(featureName);
  },
  toJS: function toJS() {
    return splits.toJS();
  }
};
//# sourceMappingURL=index.js.map