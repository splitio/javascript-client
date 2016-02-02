/* @flow */ 'use strict';

require('babel-polyfill');

let _splits = new Map();

module.exports = {

  update(splits /*: Array<Split>*/) /*: void */ {

    splits.forEach(s => {
      if (!s.isGarbage()) {
        _splits.set(s.getKey(), s);
      } else {
        _splits.delete(s.getKey());
      }
    });

  },

  get(featureName /*: string */) /*: Split */ {
    return _splits.get(featureName);
  },

  toJSON() {
    return _splits;
  }

};
