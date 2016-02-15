/* @flow */ 'use strict';

let _splits = new Map();

module.exports = {
  // Update the internal Map given an Array of new splits.
  update(splits /*: Array<Split>*/) /*: void */ {
    splits.forEach(split => {
      if (!split.isGarbage()) {
        _splits.set(split.getKey(), split);
      } else {
        _splits.delete(split.getKey());
      }
    });
  },

  // Get the split given a feature name.
  get(featureName /*: string */) /*: Split */ {
    return _splits.get(featureName);
  },

  // Get the current Set of segments across all the split instances available.
  getSegments() /*: Set */ {
    let collection = new Set();

    for(let split of _splits.values()) {
      collection = new Set([...collection, ...(split.getSegments())]);
    }

    return collection;
  },

  // Allow stringify of the internal structure.
  toJSON() /*: object */ {
    return _splits;
  }
};
