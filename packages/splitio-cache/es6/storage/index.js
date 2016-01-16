'use strict';

/**
@TODO

1- Evaluate to change the API and separate segments from splits into different
   modules.
**/

var Immutable = require('Immutable');

var splits = new Immutable.Map();
var segments = new Immutable.Map();

module.exports = {

  updateSegment(name, segmentSet) {
    segments = segments.set(name, segmentSet);
  },

  updateSplit(featureName, split) {
    splits = splits.set(featureName, split);
  },

  getSplit(featureName) {
    return splits.get(featureName);
  },

  getSegment(name) {
    return segments.get(name);
  },

  print() {
    console.log(splits.toJS());
    console.log(segments.toJS());
  }

};
