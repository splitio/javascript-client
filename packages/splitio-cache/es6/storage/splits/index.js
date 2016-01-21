/* @flow */ 'use strict';

let Immutable = require('Immutable');

let splits = new Immutable.Map();

module.exports = {
  update(updatedSplits /*: Array<Split>*/) /*: void */ {
    splits = splits.withMutations(splits => {
      updatedSplits.forEach(updatedSplit => {
        splits = splits.set(updatedSplit.getKey(), updatedSplit);
      });

      return splits;
    });
  },

  get(featureName /*: string */) /*: Set */ {
    return splits.get(featureName);
  },

  toJS() {
    return splits.toJS();
  }
};
