/* @flow */ 'use strict';

let Immutable = require('Immutable');

let segments = new Immutable.Set();

module.exports = {

  update(newSegments /*: Set */) {
    segments = newSegments;
  },

  has(name /*: string */) /*: boolean */ {
    return segments.has(name);
  },

  toJS() /*: string */ {
    return segments.toJS();
  }

};
