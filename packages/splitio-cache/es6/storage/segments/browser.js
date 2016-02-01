/* @flow */ 'use strict';

require('babel-polyfill');

let _segments = new Set();

module.exports = {

  update(segments /*: Set */) {
    _segments = segments;
  },

  has(name /*: string */) /*: boolean */ {
    return _segments.has(name);
  },

  toJSON() {
    return _segments;
  }

};
