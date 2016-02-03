/* @flow */ 'use strict';

let _segments = new Map();
let log = require('debug')('splitio-cache:segments');

module.exports = {

  update(name /*: string */, segments /*: Set */) /*: void */ {
    log(`Updating segment ${name} with ${segments}`);

    _segments.set(name, segments);
  },

  get(name /*: string */) /*: Set */ {
    return _segments.get(name) || new Set();
  },

  toJSON() {
    return _segments;
  }
};
