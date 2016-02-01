/* @flow */ 'use strict';

require('babel-polyfill');

let _splits = new Map();

module.exports = {

  update(splits /*: Array<Split>*/) /*: void */ {

    splits.forEach(s => {
      _splits.set(s.getKey(), s)
    });

  },

  get(featureName /*: string */) /*: Set */ {
    return _splits.get(featureName);
  },

  toJSON() {
    return _splits;
  }

};
