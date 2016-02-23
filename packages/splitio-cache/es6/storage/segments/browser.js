/* @flow */ 'use strict';

let log = require('debug')('splitio-cache:segments');

let _segments = new Set();

module.exports = {
  update(segments /*: Set */) {
    log(`Updating my segments list with [${[...segments]}]`);

    _segments = segments;
  },

  has(name /*: string */) /*: boolean */ {
    return _segments.has(name);
  },

  toJSON() {
    return _segments;
  }
};
